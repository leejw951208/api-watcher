import { HttpException } from '@nestjs/common'
import { ExceptionCodeData } from './exception.code'

export type LogLevel = 'warn' | 'error'

export class BaseException extends HttpException {
    public readonly logLevel: LogLevel

    constructor(error: ExceptionCodeData, location: string, logLevel: LogLevel = 'error') {
        super(
            {
                errorCode: error.code,
                message: error.message,
                location: location
            },
            error.status
        )
        this.logLevel = logLevel
    }
}
