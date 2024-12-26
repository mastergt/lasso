import { Body, Controller, Get, Post, Render, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    private readonly prefix = '[AuthController]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: AuthService
    ) { }
    @Get('login')
    @Render('login')
    login(@Req() request: Request, @Res() res: Response) {
        this.logger.debug(`render login form`, this.prefix)
    }
    // Тут теперь - проверка авторизации и редирект.
    @Post('login')
    async loginSubmit(@Body() body, @Res() res: Response) {
        this.logger.debug(`user try to login `, this.prefix)
        this.logger.trace(body, this.prefix, '[loginSubmit]')
        let token = await this.service.login(body.username, body.password);
        if (token) {
            this.logger.debug(`login ${body.username} success`, this.prefix, '[loginSubmit]')
            this.logger.trace(token, this.prefix, '[loginSubmit]')
            res.cookie('token', token)
            return res.redirect('/')
        } else {
            this.logger.error(`failed to login ${body.username}`, this.prefix, '[loginSubmit]')
            return res.render('login', { error: 'error' })
        }

    }
    @Get('logout')
    logout(@Req() request: Request, @Res({ passthrough: true }) res: Response) {
        this.logger.debug(`user is logout`, this.prefix)
        this.logger.trace(request.cookies, this.prefix, '[logout]')
        res.clearCookie('token')
        return res.redirect('/auth/login');
    }
}
