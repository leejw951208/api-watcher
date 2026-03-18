import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, Inject, NotFoundException } from '@nestjs/common'
import { Response } from 'express'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'
import { BaseException } from './base.exception'
import { BAD_REQUEST, ExceptionCodeData, NOT_FOUND, SERVER_ERROR } from './exception.code'

interface ExceptionResponseData {
    timestamp?: string
    path?: string
    status?: number
    code?: string
    message?: string
    stack?: unknown
}

@Catch()
export class GlobalExceptionHandler implements ExceptionFilter {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger) {}

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest()

        // 공통 필드
        const commonResponse: ExceptionResponseData = {
            timestamp: new Date().toISOString(),
            path: request.url
        }

        // 1. BaseException (Custom)
        if (exception instanceof BaseException) {
            const status = exception.getStatus()
            const errorResponse = exception.getResponse() as ExceptionCodeData
            const message = errorResponse.message
            const logLevel = exception.logLevel

            const exceptionResponse: ExceptionResponseData = {
                ...commonResponse,
                status: status,
                code: errorResponse.code,
                message
            }

            if (logLevel === 'warn') {
                this.logger.warn(`HTTP Exception: ${message}`, {
                    ...exceptionResponse,
                    stack: exception.stack
                })
            } else {
                this.logger.error(`HTTP Exception: ${message}`, {
                    ...exceptionResponse,
                    stack: exception.stack
                })
            }
            response.status(status).json(exceptionResponse)
            return
        }

        // 2. class-validator BadRequestException
        if (exception instanceof BadRequestException) {
            const status = exception.getStatus()
            // NestJS에서 class-validator 에러일 때 getResponse()는 아래와 같은 형태:
            // { status: 400, message: [...에러배열], error: 'Bad Request' }
            const errorResponse = exception.getResponse() as any
            // 에러 메시지가 배열이면 첫 번째 메시지 또는 전체 전달 (원하는 대로)
            const message = Array.isArray(errorResponse.message) ? errorResponse.message.join(', ') : errorResponse.message

            const exceptionResponse: ExceptionResponseData = {
                ...commonResponse,
                status: status,
                code: BAD_REQUEST.GENERAL.code,
                message
            }

            this.logger.error(`HTTP Exception: ${message}`, { ...exceptionResponse, stack: exception.stack })
            response.status(status).json(exceptionResponse)
            return
        }

        // 3. NotFoundException
        if (exception instanceof NotFoundException) {
            const status = exception.getStatus()
            const exceptionResponse: ExceptionResponseData = {
                ...commonResponse,
                ...NOT_FOUND.GENERAL,
                status: status
            }
            this.logger.error(`HTTP Exception: ${exception}`, {
                ...exceptionResponse,
                stack: exception.stack
            })
            response.status(status).json(exceptionResponse)
            return
        }

        // 6. 기타 예상치 못한 에러
        const exceptionResponse: ExceptionResponseData = {
            ...commonResponse,
            ...SERVER_ERROR.GENERAL
        }
        this.logger.error(`HTTP Exception: ${exception}`, {
            ...exceptionResponse,
            stack: exception.stack
        })
        response.status(exceptionResponse.status!).json(exceptionResponse)
    }
}
