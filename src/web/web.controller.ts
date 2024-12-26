import { Body, Controller, Get, Post, Render, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { WebService } from './web.service';
import { AuthGuard } from '../auth/auth.guard';
import { Stream } from '../streams/stream.interface';

@Controller()
export class WebController {
    private readonly prefix = '[WebController]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: WebService
    ) { }
    @Get()
    @UseGuards(AuthGuard)
    @Render('index')
    async index() {
        this.logger.debug(`render index`)
        let streams: Stream[] = await this.service.getListStreams();
        // this.logger.trace(streams, this.prefix, '[index]')
        return { streams: streams }
    }
}