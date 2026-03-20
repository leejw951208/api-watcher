import Joi from 'joi'

export const commonEnvSchema = Joi.object({
    NODE_ENV: Joi.string().required(),
    DATABASE_URL: Joi.string().required(),
    REDIS_URL: Joi.string().required(),
    JWT_ACCESS_TOKEN_TTL: Joi.number().required(),
    JWT_REFRESH_TOKEN_TTL: Joi.number().required(),
    JWT_SECRET_KEY: Joi.string().required(),
    AES_ALGORITHM: Joi.string().required(),
    AES_SECRET_KEY: Joi.string().required(),
    BCRYPT_SALT_ROUNDS: Joi.number().required(),
    EMAIL_HOST: Joi.string().required(),
    EMAIL_PORT: Joi.number().required(),
    EMAIL_USER: Joi.string().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    EMAIL_FROM: Joi.string().email().required(),
    APP_BASE_URL: Joi.string().uri().required()
})
