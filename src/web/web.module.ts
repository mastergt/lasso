import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { WebService } from './web.service';
import { StreamsModule } from 'src/streams/streams.module';

@Module({
    imports: [
        // PassportModule.register({ defaultStrategy: 'jwt' }),
        StreamsModule
    ],
    controllers: [WebController],
    providers: [WebService]
})
export class WebModule { }
