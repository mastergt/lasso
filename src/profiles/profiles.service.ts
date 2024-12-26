import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { DbService } from '../db/db.service';
import { FrontProfile, Profile } from './profiles.interface';

@Injectable()
export class ProfilesService {
    private readonly prefix = '[ProfilesService]'
    constructor(
        private readonly logger: LoggerService,
        private readonly db: DbService
    ) { }
    public async findProfile(name: string): Promise<Profile> {
        let profiles: Profile[] = await this.findProfiles();
        let profile: Profile = await profiles.find(p => p.name == name);
        return profile;
    }
    public async findProfiles(): Promise<Profile[]> {
        let profiles: Profile[] = await this.db.storage.getData('/profiles');
        return profiles;
    }
    public convertProfileF2B(front: FrontProfile): Profile {
        let profile: Profile = {
            name: front.name,
            params: front.params.split(/\s{1,}/g)
        }
        if (front.command) profile.command = front.command;
        return profile;
    }
    public convertProfileB2F(profile: Profile): FrontProfile {
        let front: FrontProfile = {
            name: profile.name,
            params: profile.params.join(' ')
        }
        if (profile.command) front.command = profile.command;
        return front;
    }
    public async getProfileNames(): Promise<string[]> {
        let profiles = await this.findProfiles()
        return profiles.map(p => p.name);
    }
    public async saveProfile(profile: Profile): Promise<boolean> {
        let index = await this.db.storage.getIndex('/profiles', profile.name, "name");
        this.logger.debug(index, this.prefix, '[saveProfile]')
        let currProfile: Profile = await this.findProfile(profile.name);
        if (!currProfile) {
            this.logger.error(`failed to update profile ${profile.name} - not found in config`, this.prefix, '[saveProfile]');
            return false;
        }
        currProfile = Object.assign(currProfile, profile);
        await this.db.storage.push(`/profiles[${index}]`, currProfile);
        return true;
    }
    public async createProfile(profile: Profile): Promise<boolean> {
        let index = await this.db.storage.getIndex('/profiles', profile.name, "name");
        this.logger.debug(index, this.prefix, '[createProfile]')

        if (index != -1) {
            this.logger.error(`failed to create profile ${profile.name} - already exists`, this.prefix, '[createProfile]');
            return false;
        }
        await this.db.storage.push(`/profiles[]`, profile);
        return true;
    }
    public async deteleProfile(name: string): Promise<boolean> {
        let index = await this.db.storage.getIndex('/profiles', name, "name");
        this.logger.debug(index, this.prefix, '[deteleProfile]')
        let currProfile = this.findProfile(name);
        if (!currProfile) {
            this.logger.error(`failed to delete profile ${name} - not found in config`, this.prefix, '[deteleProfile]');
            return false;
        }
        await this.db.storage.delete(`/profiles[${index}]`);
        return true;
    }
}
