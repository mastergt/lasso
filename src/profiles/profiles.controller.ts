import { Body, Controller, Get, Post, Query, Render, Res, UseGuards } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { AuthGuard } from '../auth/auth.guard';
import { Response } from 'express';
import { ProfilesService } from './profiles.service';
import { FrontProfile, Profile } from './profiles.interface';

@Controller('profiles')
export class ProfilesController {
    private readonly prefix = '[StreamsController]'
    constructor(
        private readonly logger: LoggerService,
        private readonly service: ProfilesService
    ) { }
    @UseGuards(AuthGuard)
    @Render('profiles')
    @Get()
    async renderProfiles(): Promise<any> {
        this.logger.debug('start render ffmpeg profiles', this.prefix, '[renderProfiles]')
        let profileNames: string[] = await this.service.getProfileNames();
        this.logger.trace(profileNames, this.prefix, '[renderProfiles]')
        return { profileNames: profileNames };
    }
    @UseGuards(AuthGuard)
    @Render('profile_form')
    @Get('edit')
    async renderEditProfile(@Query('name') name: string) {
        let profile: Profile | FrontProfile = await this.service.findProfile(name);
        if (profile) profile = this.service.convertProfileB2F(profile);
        console.log(profile)
        return {
            isCreate: false,
            profile: profile
        }
    }
    @UseGuards(AuthGuard)
    @Post('edit')
    async editProfile(@Body() frontProfile: FrontProfile, @Res() res: Response) {
        // Добавить - проверку формы!
        let backendProfile: Profile = this.service.convertProfileF2B(frontProfile)
        this.logger.trace(backendProfile, this.prefix, '[editProfile]')
        let saveRes = await this.service.saveProfile(backendProfile);
        // Добавить фичу перезапуска потоков, зависимых от этого профиля
        if (saveRes) return res.redirect('/profiles')
    }
    @UseGuards(AuthGuard)
    @Render('profile_form')
    @Get('create')
    async renderCreateProfile(): Promise<any> {
        return {
            isCreate: true,
            profile: {}
        }
    }
    //Добавить проверку формы?
    @UseGuards(AuthGuard)
    @Post('create')
    async createProfile(@Body() profile: FrontProfile, @Res() res: Response) {
        this.logger.trace(profile, this.prefix, '[createProfile]')
        let backendProfile: Profile = this.service.convertProfileF2B(profile)
        let createRes = await this.service.createProfile(backendProfile)
        if (createRes) return res.redirect('/profiles')
    }
    @UseGuards(AuthGuard)
    @Post('clone/start')
    @Render('profile_form')
    async cloneProfileRender(@Body() frontProfile: FrontProfile) {
        let found = frontProfile.name.match(/(#)(\d{0,})$/);
        if (!found) frontProfile.name = frontProfile.name + ' #2';
        else {
            console.log(found);
            if (found[2]) {
                frontProfile.name = frontProfile.name.replace(/\d{1,}$/, '') + (Number(found[2]) + 1);
            } else {
                frontProfile.name = frontProfile.name + ' #2';
            }
        }
        return {
            isCreate: true,
            profile: frontProfile
        }
    }
    @UseGuards(AuthGuard)
    @Post('delete/unconfirm')
    async profileDelUnconfirm(@Body() body, @Res() res: Response) {
        this.logger.debug(`try ask to delete profile ${body.name}`, this.prefix);
        this.logger.trace(body, this.prefix, '[delete/unconfirm]');
        return res.render('profile_delete_unconfirm', body);
    }
    // Выводить список работающих потоков на этом профиле?
    @UseGuards(AuthGuard)
    @Post('delete/confirm')
    async profileDelСonfirm(@Body() body, @Res() res: Response) {
        this.logger.debug(`try to delete profile ${body.number}`, this.prefix);
        this.logger.trace(body, this.prefix, '[delete/confirm]');
        let deRes: boolean = await this.service.deteleProfile(body.number)
        return res.redirect('/profiles')
    }
}
