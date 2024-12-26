import { spawn } from 'child_process';
import { Stream, Ffmpeg } from './stream.interface';
import { LoggerService } from '../logger/logger.service';
import { EventEmitter } from 'stream';
import * as moment from 'moment';
import { kill } from 'process';
import { Profile } from '../profiles/profiles.interface';
export class FfmpegEngineService {
    private prefix = '[FfmpegEngineService]'
    public stats: Ffmpeg = {} as Ffmpeg
    private stream: any;
    private isHeartbeat: boolean = false;
    private c: any;
    public readonly events = new EventEmitter();
    public lastlog: string[] = [];
    constructor(
        private readonly logger: LoggerService,
        public readonly params: Stream,
        private readonly profile: Profile
    ) {
        this.start()
        this.prefix = this.prefix + `[${params.name}]`
        this.events.on('log', log => {
            // this.logger.trace(log);
            if (this.lastlog.length > 100) {
                this.lastlog.shift();
            }
            this.lastlog.push(log);
        })

    }
    public async restart() {
        this.logger.warn(`restart stream ${this.params.name}`, this.prefix, '[restart]')
        await new Promise(f => setTimeout(f, 1000));
        this.stats.restartCount++;
        this.start()
    }
    public async start() {
        this.logger.info(`start stream ${this.params.name}`, this.prefix, '[start]')
        if (!this.stats) this.stats = {} as Ffmpeg
        this.stats.number = this.params.number;
        this.stats.isRunning = true;
        this.stats.lastStartTime = moment().unix();
        this.stream = null;
        this.c = new AbortController();
        const { signal } = this.c;
        this.stream = spawn('ffmpeg', this.paramsParser(this.profile.params, [this.params.input, this.params.output]), {
            signal,
            shell: true
        })
        this.logger.debug(`start ffmpeg with pid ${this.stream.pid}`, this.prefix);
        if (this.stream) if (this.stream.pid) {
            this.stats.pid = this.stream.pid + 1;
        }
        this.heartbeat();

    }
    /**
     * Внимание! Согласно документации spawn создает свой процесс, а запущенный внутри него с опцией shell: true - 
     * создаёт свой. Согласно документации spawn.kill()  убивает лишь первичный процесс spawn, а вторичный работает и дальше.
     * опция detach - не помогает.
     * Пока за основу взял то, что spawn создает процесс ffmpeg как pid самого процесса spawn +1.
     * Потому и вызываю обычный kill с параметром pid+1;
     * В будущем, возможно, потребуется дополнительные проверки, прежде чем убивать процесс.
     * @returns 
     */
    public async stop() {
        return new Promise(resolve => {
            if (!this.stream) {
                this.logger.warn(`stream already killed`, this.prefix);
                return;
            }
            let timeout = setTimeout(() => {
                this.logger.error(`something was wrong! not received sigkill`, this.prefix, this.params.number);
                return resolve(true)
            }, 3000)
            this.params.isActive = false;
            process.kill(this.stats.pid);
            this.stream.kill('SIGKILL');
            this.stream = null;
            this.events.once('close', data => {
                this.logger.info(`stream properly closed`, this.prefix, this.params.number);
                clearTimeout(timeout);
                return resolve(true)
            })

        })

    }
    private heartbeat() {
        if (!this.stream) {
            this.logger.warn(`cant start stream heartbeat! ${this.params.name}`, this.prefix, '[heartbeat]');
        }
        this.stream.stdout.on("data", data => {
            this.logger.debug(`stdout: ${data}`, this.prefix);
            this.events.emit('log', data.toString())
        });

        this.stream.stderr.on("data", data => {
            // Сделать этот анализ опциональным. Грузит ЦП.
            // this.ffmpegWorkParser(data);
            // this.logger.trace(`stderr: ${data}`, this.prefix);
            this.events.emit('log', data.toString())
        });

        this.stream.on("error", error => {
            this.logger.error(`error: ${error.message}`, this.prefix);
            this.events.emit('log', error.toString())
        });

        this.stream.on("close", code => {
            this.logger.fatal(`child process exited with code ${code}`, this.prefix);
            this.stats.isRunning = false;
            this.stats.lastStopTime = moment().unix();
            this.events.emit(String(this.params.number), { name: this.params.name, number: this.params.number, log: 'close' })
            this.events.emit('close', true);
            if (this.params.isActive) this.restart()
        });
        this.isHeartbeat = true;
    }
    private paramsParser(params: any[], vars: any[]) {
        let parsedArr = []
        for (let param of params) {
            if (/^{{.*}}$/.test(param)) {
                parsedArr.push(vars.shift())
                this.logger.warn(param, this.prefix)
                if (!param) {
                    this.logger.error(`missmatch param length`, this.prefix, '[paramsParser]')
                }
            } else parsedArr.push(param)
        }
        return parsedArr;
    }

    private ffmpegWorkParser(str: string) {
        if (!str) return;
        str = String(str);
        console.log(str)
        let regex = /\s*(frame)=\s*(\d*)\s*(fps)=\s*(\d*)\s*(q)=(\d*\.\d*)\s*(size)=\s*(\d*)(\D*)\s*(time)=(\d\d:\d\d:\d\d).*(bitrate)=(\d*)\D*\d*(\D*)\s(dup)=(\d*)\s(\D*)=(\d*)\s(speed)=\s*(\d*.*)x/;
        let arr = str.match(regex);
        console.log(arr)
    }
    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}