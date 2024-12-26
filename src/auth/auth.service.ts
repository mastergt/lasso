import { Injectable, Req, Res } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../config/config.service';
import { DbService } from '../db/db.service';
import { JwtPayload } from './auth.interface';

@Injectable()
export class AuthService {
    private prefix = '[AuthService]'
    constructor(
        private readonly logger: LoggerService,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly db: DbService
    ) { }
    public async login(username: string, password: string): Promise<string> {
        let users = await this.db.storage.getData('/users');
        this.logger.trace(users, this.prefix, '[login]')
        let user = users.find(u => u.username == username);
        if (!user) {
            this.logger.warn(`user ${username} not found`, this.prefix, '[login]');
            return null;
        }
        if (user.password == password) return this.makeToken(username);
        else {
            this.logger.warn(`incorrect password`, this.prefix, '[login]');
            return null;
        }
    }
    public checkToken(@Req() request: Request): boolean {
        if (!request.cookies) {
            this.logger.warn(`incorrect request`, this.prefix, '[checkToken]')
            return false
        }
        if (!request.cookies.token) {
            this.logger.debug(`already logined`, this.prefix, '[checkToken]')
            return false
        }
        try {
            let tokenData = this.jwtService.verify(request.cookies.token, { secret: this.config.get('jwtSecret') })
            this.logger.trace(tokenData, this.prefix, '[checkToken]');
            this.logger.info(`start validate user token`, this.prefix, '[checkToken]')
            return true;
        } catch (error) {
            this.logger.error(error, this.prefix, '[checkToken]')
            return false;
        }
    }
    private makeToken(username,): string {
        let token: string = "";
        let payload: JwtPayload = {
            username: username,
            // cryptoPass: crypto.AES.encrypt(pass, this.config.get('passCipher')).toString(),
        }
        token = this.jwtService.sign(payload);
        return token;
    }
}
