export interface MyLogger {
    trace(message: string): void
    debug(message: string): void
    log(message: string): void
    info(message: string): void
    warn(message: string): void
    error(message: string): void
    fatal(message: string): void
}