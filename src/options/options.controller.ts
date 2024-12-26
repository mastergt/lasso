import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { AuthGuard } from '../auth/auth.guard';
import { OptionsService } from './options.service';

@Controller('options')
export class OptionsController {
    private readonly prefix = '[StreamsController]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: OptionsService
    ) { }
    @UseGuards(AuthGuard)
    @Render('options')
    @Get()
    async renderOptions(): Promise<any> {
        this.logger.debug('start render app options', this.prefix, '[renderOptions]')
        let options = []
        // this.logger.trace(profileNames, this.prefix, '[renderOptions]')
        return { options: options };
    }
}
