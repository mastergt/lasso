import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import { AuthController } from './auth.controller';
@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('jwtSecret'),
            }),
            inject: [ConfigService]
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [
        AuthService
    ]
})
export class AuthModule { }
