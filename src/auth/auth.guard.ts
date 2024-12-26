import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
    private readonly prefix = '[AuthGuard]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: AuthService
    ) { }
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request: Request = context.switchToHttp().getRequest();
        const response: Response = context.switchToHttp().getResponse();
        let checkTokenRes: boolean = this.service.checkToken(request);
        this.logger.trace(checkTokenRes, this.prefix)
        if (checkTokenRes) return checkTokenRes;
        else
            response.redirect('/auth/login');
    }
}