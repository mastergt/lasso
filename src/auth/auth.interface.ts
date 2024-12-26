export interface JwtPayload {
    username: string;
    // cryptoPass: string;
    auth?: string[];
    iat?: number
}