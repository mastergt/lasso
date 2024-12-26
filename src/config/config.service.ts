import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
    private readonly envConfig: { [key: string]: string };

    constructor(filePath: string) {
        let file;
        try {
            file = fs.readFileSync(filePath)
        } catch (error) {
            file = fs.readFileSync(`../${filePath}`)
        }
        this.envConfig = dotenv.parse(file)

    }

    get(key: string): string {
        return this.envConfig[key];
    }
}