export interface Stream {
    name: string;
    number: number;
    input: string;
    output: string;
    ffmpegProfile: string;
    isActive?: boolean;
}
export interface Ffmpeg {
    number: number;
    pid?: number;
    isRunning?: boolean;
    isRunningPretty?: string;
    lastStartTime?: number;
    lastStartTimePretty?: string;
    lastWorkTimePretty?: string;
    lastStopTime?: number;
    restartCount?: number;
    lastError?: string;
}
export interface SaveStream extends Stream {
    method: 'create' | 'edit';
}
export interface FrontStream extends Stream {
    ffmpeg: Ffmpeg
}

