export interface Profile {
    name: string;
    command?: string;
    params: string[]
}

export interface FrontProfile extends Omit<Profile, "params"> {
    params: string;
}