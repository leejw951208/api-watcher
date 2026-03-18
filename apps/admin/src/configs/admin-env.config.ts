import { registerAs } from '@nestjs/config'

export interface AdminEnv {
    appName: string
    appVersion: string
    apiVersion: string
    port: number
}

export default registerAs<AdminEnv>('admin', () => ({
    appName: process.env.APP_NAME ?? 'admin',
    appVersion: process.env.APP_VERSION ?? '0.0.1',
    apiVersion: process.env.API_VERSION ?? 'v1',
    port: Number(process.env.PORT) ?? 3000
}))
