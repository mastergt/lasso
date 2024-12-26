import { Module } from '@nestjs/common';
import { StreamsModule } from './streams/streams.module';
import { LoggerModule } from './logger/logger.module';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { WebModule } from './web/web.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { OptionsModule } from './options/options.module';

@Module({
    imports: [
        StreamsModule,
        LoggerModule,
        ConfigModule,
        DbModule,
        WebModule,
        AuthModule,
        ProfilesModule,
        OptionsModule
    ]
})
export class AppModule { }
