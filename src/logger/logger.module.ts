import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { ConfigModule } from '../config/config.module';
import { LoggerConfig } from './logger.config';
import { NestLogger } from './nest.logger';
@Global()
@Module({
    imports: [
        ConfigModule
    ],
    providers: [
        LoggerConfig,
        LoggerService,
        NestLogger
    ],
    exports: [
        LoggerService
    ],
})
export class LoggerModule { }