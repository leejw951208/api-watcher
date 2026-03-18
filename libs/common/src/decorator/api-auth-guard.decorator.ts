import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ApiExceptionResponse } from './api-exception-response.decorator'
import { AUTH_ERROR } from '../exception/exception.code'

export const ApiAuthGuard = () =>
    applyDecorators(
        ApiBearerAuth('JWT-Auth'),
        ApiExceptionResponse([AUTH_ERROR.MISSING_ACCESS_TOKEN, AUTH_ERROR.INVALID_ACCESS_TOKEN, AUTH_ERROR.EXPIRED_ACCESS_TOKEN])
    )
