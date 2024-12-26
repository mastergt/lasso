import { LoggerService } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { getLogger } from 'log4js';
@Injectable()
export class NestLogger implements LoggerService {
    private readonly prefix = 'nest'
    log(message: any, ...optionalParams: any[]) {
        this.sendMessage(message, 'info', optionalParams);
    }
    error(message: any, ...optionalParams: any[]) {
        this.sendMessage(message, 'error', optionalParams);
    }
    warn(message: any, ...optionalParams: any[]) {
        this.sendMessage(message, 'warn', optionalParams);
    }
    debug?(message: any, ...optionalParams: any[]) {
        this.sendMessage(message, 'debug', optionalParams);
    }
    verbose?(message: any, ...optionalParams: any[]) {
        this.sendMessage(message, 'trace', optionalParams);
    }
    private sendMessage(message, level, optionalParams: any[]) {
        if (optionalParams.length > 0) {
            // console.log(this.prefix, message, level, optionalParams)
            getLogger(optionalParams.join(','))[level](message);
        }
        else {
            // console.log(this.prefix, message, level, optionalParams)
            getLogger(this.prefix)[level](message)
        }
    }
}