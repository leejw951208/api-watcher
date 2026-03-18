import { BaseException, commonEnvSchema, SERVER_ERROR } from '@libs/common'
import Joi from 'joi'

export const validateEnvSchema = commonEnvSchema.concat(
    Joi.object({
        APP_NAME: Joi.string().required(),
        APP_VERSION: Joi.string().required(),
        API_VERSION: Joi.string().required(),
        PORT: Joi.string().required()
    })
)

export const validateUserEnv = (config: Record<string, unknown>) => {
    const { error, value } = validateEnvSchema.validate(config, {
        allowUnknown: true, // Joi 스키마에 정의되지 않은 값을 검증대상에서 제외
        stripUnknown: true, // .env 파일에 정의한 값만 ConfigService로 접근할 수 있도록 하는 옵션
        abortEarly: false // 검증 실패 시 모든 에러 메시지를 반환
    })

    if (error) {
        // common 의 환경 변수 검증 실패 검증 후 user 의 환경 변수 검증 실패 검증
        const commonEnvKeys = Object.keys(commonEnvSchema.describe().keys ?? {})
        if (error.details.some((detail) => typeof detail.path[0] === 'string' && commonEnvKeys.includes(detail.path[0]))) {
            throw new BaseException(SERVER_ERROR.CONFIG_VALIDATION_ERROR, `[Common] Config validation error: ${error.message}`, 'error')
        } else {
            throw new BaseException(SERVER_ERROR.CONFIG_VALIDATION_ERROR, `[User] Config validation error: ${error.message}`, 'error')
        }
    }

    return value
}
