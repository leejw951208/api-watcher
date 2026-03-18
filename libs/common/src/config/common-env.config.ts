import { registerAs } from '@nestjs/config'

export type CommonEnv = {
    nodeEnv: string
    databaseUrl: string
    redisHost: string
    redisPort: number
    redisPassword: string
    jwtAccessTokenTtl: number
    jwtRefreshTokenTtl: number
    jwtSecretKey: string
    aesAlgorithm: string
    aesSecretKey: string
    bcryptSaltRounds: number
    emailHost: string
    emailPort: number
    emailUser: string
    emailPassword: string
    emailFrom: string
    appBaseUrl: string
}

export const commonEnvConfig = registerAs<CommonEnv>('common', () => ({
    nodeEnv: process.env.NODE_ENV ?? 'local',
    databaseUrl: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/monorepo',
    redisHost: process.env.REDIS_HOST ?? 'localhost',
    redisPort: Number(process.env.REDIS_PORT ?? 6379),
    redisPassword: process.env.REDIS_PASSWORD ?? '',
    jwtAccessTokenTtl: Number(process.env.JWT_ACCESS_TOKEN_TTL ?? 3600000),
    jwtRefreshTokenTtl: Number(process.env.JWT_REFRESH_TOKEN_TTL ?? 604800000),
    jwtSecretKey: process.env.JWT_SECRET_KEY ?? 'your-secret-key',
    aesAlgorithm: process.env.AES_ALGORITHM ?? 'aes-256-cbc',
    aesSecretKey: process.env.AES_SECRET_KEY ?? 'your-secret-key',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
    emailHost: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
    emailPort: Number(process.env.EMAIL_PORT ?? 587),
    emailUser: process.env.EMAIL_USER ?? '',
    emailPassword: process.env.EMAIL_PASSWORD ?? '',
    emailFrom: process.env.EMAIL_FROM ?? '',
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000'
}))
