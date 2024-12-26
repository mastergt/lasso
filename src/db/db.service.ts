import { Injectable } from '@nestjs/common';
import { JsonDB, Config } from 'node-json-db';
import { LoggerService } from '../logger/logger.service';
import { EventEmitter } from 'stream';

@Injectable()
export class DbService {
    private readonly prefix = '[DbService]';
    public readonly isDbReady = new EventEmitter();
    public storage: JsonDB
    constructor(private readonly logger: LoggerService) {
        this.initDb()
    }
    private async initDb() {
        this.logger.info(`start init DB`)
        try {
            this.storage = new JsonDB(new Config("db.json", true, true, '/', true));
            await this.scalefoldingDb()
            this.isDbReady.emit('yes');
            console.log('scalefolding completed');
        } catch (error) {
            this.logger.error(error, this.prefix, '[initDb]')
        }
    }

    private async scalefoldingDb() {

        return this.storage.getData('/profiles').catch(err => {
            return 'noprofile'

        }).then(data => {
            if (data == 'noprofile') {
                return this.storage.push('/profiles', [])
            }
        }).then(data => {
            return this.storage.getData('/streams').catch(err => {
                return 'nostream'
            })
        }).then(data => {
            if (data == 'nostream') {
                return this.storage.push('/streams', [])
            }
        }).then(data => {
            return this.storage.getData('/users').catch(err => {
                return 'nousers'
            })
        }).then(data => {
            if (data == 'nousers') {
                return this.storage.push('/users', [])
            }
        })
    }
}

