import { commonEnvConfig, CommonModule } from '@libs/common'
import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigType } from '@nestjs/config'

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            global: true,
            useFactory: async (config: ConfigType<typeof commonEnvConfig>) => {
                return {
                    secret: config.jwtSecretKey,
                    signOptions: {
                        expiresIn: config.jwtAccessTokenTtl
                    }
                }
            },
            inject: [commonEnvConfig.KEY]
        }),
        CommonModule,
        UserModule
    ],
    controllers: [AuthController],
    providers: [AuthService]
})
export class AuthModule {}
