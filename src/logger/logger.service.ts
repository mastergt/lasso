import { configure, getLogger } from 'log4js';
import { ConfigService } from '../config/config.service';
import { Injectable } from '@nestjs/common';
import * as fs from "fs";

@Injectable()
export class LoggerService {
    private prefix = 'core'
    constructor(private readonly configService: ConfigService) {
        const loglevel = configService.get('loglevel') || 'trace';
        const logpathdir = configService.get('logpathdir') || 'log';
        const isLogOut = configService.get('isLogOut');
        if (!fs.existsSync(logpathdir)) {
            fs.mkdirSync(logpathdir);
        }
        let conf = {
            appenders: {
                app: {
                    type: "file",
                    filename: `${logpathdir}/app.log`,
                    maxLogSize: 10485760,
                    numBackups: 3
                },
                errorFile: {
                    type: "file",
                    filename: `${logpathdir}/errors.log`
                },
                errors: {
                    type: "logLevelFilter",
                    level: "ERROR",
                    appender: "errorFile"
                },
                console: {
                    type: "stdout"
                }
            },
            categories: {
                default: {
                    appenders: [
                        "app",
                        "errors",
                    ],
                    level: loglevel
                }
            }
        }
        if (isLogOut) conf.categories.default.appenders.push("console")
        configure(conf);

    }
    public trace(message, ...optionalParams: any[]) {
        this.sendMessage(message, 'trace', optionalParams)
    }
    public debug(message, ...optionalParams: any[]) { this.sendMessage(message, 'debug', optionalParams) }
    public info(message, ...optionalParams: any[]) { this.sendMessage(message, 'info', optionalParams) }
    public warn(message, ...optionalParams: any[]) { this.sendMessage(message, 'warn', optionalParams) }
    public error(message, ...optionalParams: any[]) { this.sendMessage(message, 'error', optionalParams) }
    public fatal(message, ...optionalParams: any[]) { this.sendMessage(message, 'fatal', optionalParams) }

    private sendMessage(message, level, optionalParams: any[]) {
        if (optionalParams.length > 0) getLogger(optionalParams.join(','))[level](message);
        else getLogger(this.prefix)[level](message)
    }
}