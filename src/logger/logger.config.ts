import { configure, Log4js } from 'log4js';
import { ConfigService } from '../config/config.service';
import { join } from 'path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerConfig {
    public logConfig: Log4js;
    constructor(protected readonly config: ConfigService) {
        let path = config.get(`logpath`) || join(__dirname + '../../../log');
        let level = config.get(`loglevel`) || 'trace';
        let logConsole = config.get(`logconsole`);
        let logsizeRaw = config.get('logsize');
        let logsize = 10485760 // default value
        if (!isNaN(Number(logsizeRaw))) {
            logsize = Number(logsizeRaw) * 1000000;
        }
        let backupsCount = config.get('logbackups') || 3;
        let loggerConfig = {
            appenders: {

                log: {
                    type: "file",
                    maxLogSize: logsize,
                    numBackups: backupsCount,
                    filename: `${path}/app.log`,
                    layout: {
                        type: 'colored'
                    }
                },
                logErrorFile: {
                    type: "file",
                    filename: `${path}/errors.log`,
                    maxLogSize: logsize,
                    numBackups: backupsCount,
                    layout: {
                        type: 'colored'
                    }
                },
                logErrors: {
                    type: "logLevelFilter",
                    level: "ERROR",
                    appender: "logErrorFile"
                },
                // Appender логгирования в консоль
                console: {
                    type: "stdout",
                }
            },
            categories: {
                default: {
                    appenders: [
                        "log",
                        "logErrors",
                    ],
                    level: level
                },

            }
        }
        if (Number(logConsole) == 1) {
            loggerConfig.categories.default.appenders.push("console")
            console.log(`logging to stdout!`)
        } else {
            console.warn(`NO logging to stdout!`)
        }
        this.logConfig = configure(loggerConfig)
    }
}