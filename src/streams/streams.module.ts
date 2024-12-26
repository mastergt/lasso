import { Module } from '@nestjs/common';
import { StreamsService } from './streams.service';
import { StreamsController } from './streams.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { EventsGateway } from './events.gateway';

@Module({
    imports: [ProfilesModule],
    providers: [
        StreamsService,
        EventsGateway
    ],
    controllers: [StreamsController],
    exports: [
        StreamsService
    ]
})
export class StreamsModule { }
