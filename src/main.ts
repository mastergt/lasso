import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { NestLogger } from './logger/nest.logger';
import { ConfigService } from './config/config.service'
import { LoggerService } from './logger/logger.service'
import * as cookieParser from 'cookie-parser';
import * as hbs from 'hbs';
import * as exphbs from 'express-handlebars';

async function bootstrap() {
    const app: any = await NestFactory.create(AppModule, {
        logger: new NestLogger()
    });
    let config: ConfigService = app.get(ConfigService)
    let logger: LoggerService = app.get(LoggerService)
    let port = config.get("port");
    let ip = config.get("ip");
    app.enableCors();
    app.use(cookieParser());
    app.useStaticAssets(join(__dirname, '..', 'assets'));
    app.setBaseViewsDir(join(__dirname, '..', 'views'));
    hbs.registerPartials(join(__dirname, '..', 'views/partials'));
    hbs.registerHelper({
        hlp: (echo) => `Echo: ${echo}.`,
        loud: (aString) => aString.toUpperCase(),
        option: (value, label, selectedValue) => {
            var selectedProperty = value == selectedValue ? 'selected="selected"' : '';
            console.log(`${value}  ${selectedValue}`);
            return new hbs.SafeString('<option value="' + value + '"' + selectedProperty + '>' + label + "</option>");
        }
    })
    app.setViewEngine('hbs');
    logger.info(`start app at ${ip}:${port}`);
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
        await app.listen(port, ip);
    } else {
        logger.info(`[MAIN] no ip setted. Listen any address`);
        await app.listen(port);
    }
}
bootstrap();
