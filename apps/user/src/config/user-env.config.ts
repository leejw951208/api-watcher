import { registerAs } from '@nestjs/config'

export interface UserEnv {
    appName: string
    appVersion: string
    apiVersion: string
    port: number
}

export const userEnvConfig = registerAs<UserEnv>('user', () => ({
    appName: process.env.APP_NAME ?? 'User',
    appVersion: process.env.APP_VERSION ?? '0.0.1',
    apiVersion: process.env.API_VERSION ?? 'v1',
    port: Number(process.env.PORT) ?? 3000
}))
