import { applyDecorators } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { ErrorResponseDto } from '../dto/error-response.dto'
import { ExceptionCodeData } from '../exception/exception.code'

type ErrorCodeOrArray = ExceptionCodeData | ExceptionCodeData[]

export const ApiExceptionResponse = (errorCodes: ErrorCodeOrArray) => {
    const errors = Array.isArray(errorCodes) ? errorCodes : [errorCodes]

    // status별로 그룹화
    const statusMap = new Map<number, ExceptionCodeData[]>()
    errors.forEach((err) => {
        const existing = statusMap.get(err.status) || []
        existing.push(err)
        statusMap.set(err.status, existing)
    })

    // 각 status별로 ApiResponse 데코레이터 생성
    const decorators = Array.from(statusMap.entries()).map(([status, errorList]) => {
        const examples: Record<string, any> = {}
        errorList.forEach((err) => {
            examples[err.code] = {
                summary: err.message,
                value: {
                    errorCode: err.code,
                    message: err.message,
                    location: 'ServiceName'
                }
            }
        })

        return ApiResponse({
            status,
            description: errorList.map((e) => e.message).join(' / '),
            schema: {
                $ref: getSchemaPath(ErrorResponseDto)
            },
            content: {
                'application/json': {
                    examples
                }
            }
        })
    })

    return applyDecorators(ApiExtraModels(ErrorResponseDto), ...decorators)
}
