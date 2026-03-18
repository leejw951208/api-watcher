import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger'
import { ResponseDto } from '../dto/response.dto'

type Options = {
    description?: string
    dataKey?: string
    metaSchema?: Record<string, unknown>
}

function ApiOkBase<TModel extends Type<unknown>>(model: TModel, options: Options = {}) {
    const dataKey = options.dataKey ?? 'data'
    return applyDecorators(
        ApiExtraModels(ResponseDto, model),
        ApiOkResponse({
            description: options.description,
            schema: {
                type: 'object',
                properties: {
                    [dataKey]: { $ref: getSchemaPath(model) }
                },
                required: [dataKey]
            }
        })
    )
}

function ApiOkSimple(options: Options = {}) {
    const dataKey = options.dataKey ?? 'data'
    return applyDecorators(
        ApiExtraModels(ResponseDto),
        ApiOkResponse({
            description: options.description,
            schema: {
                type: 'object',
                properties: {
                    [dataKey]: {
                        type: 'object',
                        description: 'Response data'
                    }
                },
                required: [dataKey]
            }
        })
    )
}

export const ApiOkBaseResponse = <T extends Type<unknown>>(modelOrOptions?: T | (Options & { type?: T })) => {
    if (!modelOrOptions) {
        return ApiOkSimple()
    }
    if (typeof modelOrOptions === 'function') {
        return ApiOkBase(modelOrOptions)
    }
    if ('type' in modelOrOptions && modelOrOptions.type) {
        const { type, ...rest } = modelOrOptions
        return ApiOkBase(type, rest)
    }
    return ApiOkSimple(modelOrOptions)
}
