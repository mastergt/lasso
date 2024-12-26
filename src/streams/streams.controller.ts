import { Body, Controller, Get, Param, Post, Query, Render, Res, UseGuards } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { StreamsService } from './streams.service';
import { Response } from 'express';
import { FfmpegEngineService } from './ffmpeg.engine.service';
import { SaveStream, Stream, Ffmpeg } from './stream.interface';
import { AuthGuard } from '../auth/auth.guard';
import { ProfilesService } from '../profiles/profiles.service';
/**
 * Контроллер для управления потоками. 
 * Задачи:
 * 1. Добавить поток. 
 * 2. Править поток.
 * 3. Удалить поток.
 * 4. Управление потоком (старт, стоп)
 */
@Controller('streams')
export class StreamsController {
    private readonly prefix = '[StreamsController]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: StreamsService,
        private readonly profileService: ProfilesService
    ) { }
    @UseGuards(AuthGuard)
    @Get('edit')
    async startEditStream(@Query('number') number: number, @Res() res: Response) {
        this.logger.trace(number, this.prefix, '[startEditStream]')
        this.logger.debug(`start find stream number: ${number}`, this.prefix, '[startEditStream]')
        let stream: Stream = await this.service.findStream(number);
        this.logger.trace(stream, this.prefix, '[startEditStream]')
        let profiles = await this.profileService.getProfileNames();
        return res.render('stream_form', {
            isCreate: false,
            stream: stream,
            profiles: profiles
        })
    }
    @UseGuards(AuthGuard)
    @Get('create')
    async startCreateStream(@Res() res: Response) {
        this.logger.debug(`start create stream`, this.prefix, '[startCreateStream]')
        let profiles = await this.profileService.getProfileNames();
        return res.render('stream_form', {
            isCreate: true,
            isNotSelected: true,
            stream: {},
            profiles: profiles
        })
    }
    /**
     * Сохранить изменения. Добавить проверку формы?
     */
    @UseGuards(AuthGuard)
    @Post('edit')
    async updateStream(@Body() data: Stream, @Res() res: Response) {
        this.logger.trace(data, this.prefix, '[updateStream]')
        await this.service.updateStream(data)
        return res.redirect('/');
    }
    @UseGuards(AuthGuard)
    @Get('logs')
    @Render('stream_logs')
    async renderLogsPage(@Query() data: Partial<Stream>,) {
        this.logger.trace(data, this.prefix, '[renderLogsPage]')
        return data;
    }
    //Добавить проверку формы?
    @UseGuards(AuthGuard)
    @Post('create')
    async createStream(@Body() data: Stream, @Res() res: Response) {
        this.logger.trace(data, this.prefix, '[createStream]')
        await this.service.createStream(data)
        return res.redirect('/');
    }
    @UseGuards(AuthGuard)
    @Get(':number/status')
    streamStatus(@Param('number') number: number) {
        number = Number(number);
        let runningStream = this.service.findRunningStream(number);
        return runningStream.stats;
    }
    @UseGuards(AuthGuard)
    @Post('stop')
    async streamStopButton(@Body('number') number: number, @Res() res: Response) {
        this.logger.debug(`try to stop stream ${number}`, this.prefix);
        await this.service.stopStream(number)
        return res.redirect('/')
    }
    @UseGuards(AuthGuard)
    @Post('start')
    async streamStartButton(@Body('number') number: number, @Res() res: Response) {
        this.logger.debug(`try to start stream ${number}`, this.prefix);
        await this.service.startStreamButton(number)
        return res.redirect('/')
    }
    @UseGuards(AuthGuard)
    @Post('delete/unconfirm')
    async streamDelUnconfirm(@Body() body, @Res() res: Response) {
        this.logger.debug(`try ask to delete stream ${body.number}`, this.prefix);
        this.logger.trace(body, this.prefix, '[delete/unconfirm]');
        return res.render('stream_delete_unconfirm', body);
    }
    @UseGuards(AuthGuard)
    @Post('delete/confirm')
    async streamDelСonfirm(@Body() body, @Res() res: Response) {
        this.logger.debug(`try to delete stream ${body.number}`, this.prefix);
        this.logger.trace(body, this.prefix, '[delete/confirm]');
        let deRes: boolean = await this.service.deteleStream(body.number)
        return res.redirect('/')
    }
    @UseGuards(AuthGuard)
    @Post('clone/start')
    @Render('stream_form')
    async cloneProfileRender(@Body() stream: Stream) {
        let newNumber: number = await this.service.detectUniqueFreeNumber();
        stream.number = newNumber;
        let profiles = await this.profileService.getProfileNames();
        return {
            isCreate: true,
            isClone: true,
            stream: stream,
            profiles: profiles
        }
    }
}
