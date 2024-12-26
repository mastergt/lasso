import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { DbService } from '../db/db.service';
import { ConfigService } from '../config/config.service';
import { StreamsService } from '../streams/streams.service';
@Injectable()
export class WebService {
    private readonly prefix = '[WebService]'
    constructor(
        private readonly logger: LoggerService,
        private readonly db: DbService,
        private readonly config: ConfigService,
        private readonly stream: StreamsService
    ) { }

    public async getListStreams() {
        let streams = await this.stream.getStreamList()
        // this.logger.trace(streams, this.prefix);
        return streams;
    }

}
