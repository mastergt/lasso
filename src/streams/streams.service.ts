import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { DbService } from '../db/db.service';
import { FfmpegEngineService } from './ffmpeg.engine.service'
import { Stream, Ffmpeg, FrontStream } from './stream.interface';
import * as moment from 'moment';
import { Profile } from '../profiles/profiles.interface';
// import delay from 'delay';

/**
 * Задача сервиса - читать конфиг, запускать стримы и контролировать их работу.
 */
@Injectable()
export class StreamsService {
    private readonly prefix = '[StreamsService]'
    private runningStreams: FfmpegEngineService[] = []
    constructor(
        private readonly logger: LoggerService,
        private readonly db: DbService
    ) {
        this.db.isDbReady.on('yes', () => {
            this.starter()
        })
    }
    /**
     * Для web-интерфейса. Получить список стримов. Будем получать 2 массива. Из конфига и из памяти.
     * Мержить и отдавать.
     */
    public async getStreamList(): Promise<FrontStream[]> {
        let frontStreams: FrontStream[] = [];
        let streams: Stream[] = await this.db.storage.getData('/streams');
        let onlineStreams: FfmpegEngineService[] = this.runningStreams;
        streams.forEach(stream => {
            let frontStream: FrontStream = Object.assign({}, stream) as unknown as FrontStream;
            let onlineStream = onlineStreams.find(r => r.params.number == stream.number);
            if (onlineStream) {
                if (!frontStream.ffmpeg) frontStream.ffmpeg = {} as Ffmpeg;
                moment.locale('ru');
                frontStream.ffmpeg.isRunning = onlineStream.stats.isRunning
                if (frontStream.ffmpeg.isRunning) {
                    frontStream.ffmpeg.isRunningPretty = 'работает';
                    frontStream.ffmpeg.lastWorkTimePretty = moment.unix(onlineStream.stats.lastStartTime).fromNow();
                    frontStream.ffmpeg.lastStartTimePretty = moment.unix(onlineStream.stats.lastStartTime).format('DD-MM-YYYY HH:mm');
                    frontStream.ffmpeg.pid = onlineStream.stats.pid;
                    frontStream.ffmpeg.restartCount = onlineStream.stats.restartCount;
                }
                else {
                    frontStream.ffmpeg.isRunningPretty = 'остановлен';
                    frontStream.ffmpeg.lastWorkTimePretty = null;
                    frontStream.ffmpeg.lastStartTimePretty = null;
                }
            }
            else {
                frontStream.ffmpeg = {} as Ffmpeg;
            }
            frontStreams.push(frontStream);
        })
        return frontStreams;
    }
    public async starter() {
        this.delay(1000);
        let profiles: Profile[] = await this.profileLoader();
        let streams: Stream[] = await this.db.storage.getData('/streams')
        if (Array.isArray(streams)) {
            for (let stream of streams) {
                await this.startStream(stream, profiles);
                await this.delay(100);
            }
        } else {
            this.logger.error(`no streams config! Create empty`, this.prefix, '[starter]')
        }
        this.logger.debug(streams, this.prefix, '[starter]')

    }
    public findRunningStream(streamNumber: number): FfmpegEngineService {
        return this.runningStreams.find(stream => stream.params.number == streamNumber);

    }
    public async findStream(streamNumber: number): Promise<Stream> {
        let streams: Stream[] = await this.db.storage.getData('/streams');
        let stream = streams.find(stream => stream.number == streamNumber);
        if (stream) return stream;
    }
    public async stopStream(number: number) {
        let index = this.runningStreams.findIndex(r => r.params.number == number);
        if (index == -1) {
            this.logger.warn(`cant find stream number ${number} in active ffmpeg streams`, this.prefix, '[stopStream]');
            return;
        }
        let streamActive = this.runningStreams[index];
        if (streamActive) {
            await streamActive.stop();
            this.runningStreams.splice(index, 1); // новое. Удаление экземпляра класса после остановки ffmpeg;
        }
        let stream: Stream = await this.findStream(number);
        if (stream) {
            stream.isActive = false;
            await this.updateStream(stream);
        }
        return;
    }
    public async startStreamButton(number: number) {
        let runningStream = this.runningStreams.find(r => r.params.number == number);
        if (runningStream) {
            this.logger.debug(`start already starting stream number ${number}`, this.prefix, '[startStreamButton]')
            runningStream.start();
        }
        else {
            this.logger.debug(`create new stream number ${number} for start`, this.prefix, '[startStreamButton]')
            let stream: Stream = await this.findStream(number);
            if (stream) {
                stream.isActive = true;
                await this.updateStream(stream);
                let profiles: Profile[] = await this.profileLoader();
                this.logger.debug(`start stream number ${number}`, this.prefix, '[startStreamButton]')
                await this.startStream(stream, profiles);
            }
        }
        return;
    }
    public async updateStream(stream: Stream): Promise<boolean> {
        let index = await this.db.storage.getIndex('/streams', stream.number, "number");
        this.logger.debug(index, this.prefix, '[updateStream]')
        let currStream: Stream = await this.findStream(stream.number);
        if (!currStream) {
            this.logger.error(`failed to update stream ${stream.number} - not found in config`, this.prefix, '[updateStream]');
            return false;
        }
        currStream = Object.assign(currStream, stream);
        await this.db.storage.push(`/streams[${index}]`, currStream, true);
        return true;
    }
    public async createStream(stream: Stream): Promise<boolean> {
        let index = await this.db.storage.getIndex('/streams', stream.number, "number");
        this.logger.debug(index, this.prefix, '[updateStream]')

        if (index != -1) {
            this.logger.error(`failed to create stream ${stream.number} -already exists`, this.prefix, '[updateStream]');
            return false;
        }
        this.logger.warn(stream, this.prefix, '[createStream]')
        await this.db.storage.push(`/streams[]`, stream);
        return true;
    }
    public async deteleStream(number: number): Promise<boolean> {
        let index = await this.db.storage.getIndex('/streams', number, "number");
        this.logger.debug(index, this.prefix, '[deteleStream]')
        let currStream = this.findStream(number);
        if (!currStream) {
            this.logger.error(`failed to delete stream ${number} - not found in config`, this.prefix, '[deteleStream]');
            return false;
        }
        await this.db.storage.delete(`/streams[${index}]`);
        return true;
    }
    public async detectUniqueFreeNumber() {
        let streams: Stream[] = await this.db.storage.getData('/streams');
        let i = 1;
        while (true) {
            if (streams.find(str => str.number == i)) i++;
            else break;
        }
        return i;
    }
    private async startStream(stream: Stream, profiles: Profile[]) {
        if (!stream.ffmpegProfile || !stream.input || !stream.output || !stream.name) {
            this.logger.debug(`wrong stream ${stream.name} configuration.Skip it`)
            return;
        }
        let profileParams = profiles.find(el => el.name == stream.ffmpegProfile);
        if (!profileParams) {
            this.logger.error(`cant find ffmpeg profile for channel ${stream.name}`, this.prefix, '[starter]');
            return;
        } else {
            if (stream.isActive)
                this.runningStreams.push(new FfmpegEngineService(this.logger, stream, profileParams))
            else this.logger.info(`${stream.name} is not active`, this.prefix, '[starter]')
        }
    }
    private async profileLoader(): Promise<Profile[]> {
        this.logger.debug(`start profile loader`, this.prefix, '[profileLoader]');
        try {
            let profiles = await this.db.storage.getData('/profiles')
            if (!Array.isArray(profiles)) {
                this.logger.error(`invalid profiles. Create empty one`, this.prefix, '[profileLoader]')

            }
            return profiles;
        } catch (error) {
            this.logger.error(error, this.prefix, '[profileLoader]');
            return [];
        }

    }
    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
