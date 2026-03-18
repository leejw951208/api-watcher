import { commonEnvConfig, CommonModule } from '@libs/common'
import { Module } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AdminAuthController } from './auth.controller'
import { AdminAuthService } from './auth.service'
import { AdminRepository } from './admin.repository'

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            global: true,
            useFactory: async (config: ConfigType<typeof commonEnvConfig>) => ({
                secret: config.jwtSecretKey,
                signOptions: { expiresIn: config.jwtAccessTokenTtl }
            }),
            inject: [commonEnvConfig.KEY]
        }),
        CommonModule
    ],
    controllers: [AdminAuthController],
    providers: [AdminAuthService, AdminRepository]
})
export class AdminAuthModule {}
