import { AUTH_ERROR, BaseException, commonEnvConfig, CryptoService, REDIS_CLIENT, TokenService, USER_ERROR } from '@libs/common'
import { Owner } from '@libs/prisma'
import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { plainToInstance } from 'class-transformer'
import { randomUUID } from 'crypto'
import Redis from 'ioredis'
import { AdminRepository } from './admin.repository'
import { AdminSigninRequestDto } from './dto/admin-signin-request.dto'
import { AdminResponseDto, AdminSigninResponseDto } from './dto/admin-signin-response.dto'

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly adminRepository: AdminRepository,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>,
        private readonly cryptoService: CryptoService,
        private readonly tokenService: TokenService
    ) {}

    async signin(reqDto: AdminSigninRequestDto): Promise<{ resDto: AdminSigninResponseDto; refreshToken: string }> {
        const foundAdmin = await this.adminRepository.findByLoginId(reqDto.loginId)
        if (!foundAdmin) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        const isMatched = await this.cryptoService.compare(reqDto.password, foundAdmin.password)
        if (!isMatched) throw new BaseException(AUTH_ERROR.PASSWORD_NOT_MATCHED, this.constructor.name)

        const jti = randomUUID()
        const [accessToken, refreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundAdmin.id, Owner.ADMIN, jti),
            this.tokenService.createRefreshToken(foundAdmin.id, Owner.ADMIN, jti)
        ])

        const hashedRefreshToken = await this.cryptoService.hash(refreshToken)
        await this.tokenService.saveRefreshToken(foundAdmin.id, Owner.ADMIN, jti, hashedRefreshToken, this.config.jwtRefreshTokenTtl)

        const resDto = plainToInstance(
            AdminSigninResponseDto,
            {
                accessToken,
                admin: plainToInstance(AdminResponseDto, foundAdmin, { excludeExtraneousValues: true })
            },
            { excludeExtraneousValues: true }
        )

        return { resDto, refreshToken }
    }

    async signout(refreshToken: string): Promise<void> {
        const payload = await this.tokenService.verify(refreshToken, 're')

        const foundAdmin = await this.adminRepository.findById(payload.id)
        if (!foundAdmin) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        await this.tokenService.deleteRefreshToken(foundAdmin.id, Owner.ADMIN, payload.jti)
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = await this.tokenService.verify(refreshToken, 're')

        const foundAdmin = await this.adminRepository.findById(payload.id)
        if (!foundAdmin) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        const foundCachedToken = await this.tokenService.getRefreshToken(foundAdmin.id, Owner.ADMIN, payload.jti)
        if (!foundCachedToken) throw new BaseException(AUTH_ERROR.MISSING_REFRESH_TOKEN, this.constructor.name)

        const isMatched = await this.cryptoService.compare(refreshToken, foundCachedToken)
        if (!isMatched) throw new BaseException(AUTH_ERROR.INVALID_REFRESH_TOKEN, this.constructor.name)

        await this.tokenService.deleteRefreshToken(foundAdmin.id, Owner.ADMIN, payload.jti)

        const jti = randomUUID()
        const [newAccessToken, newRefreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundAdmin.id, Owner.ADMIN, jti),
            this.tokenService.createRefreshToken(foundAdmin.id, Owner.ADMIN, jti)
        ])

        const hashedNewRefreshToken = await this.cryptoService.hash(newRefreshToken)
        await this.tokenService.saveRefreshToken(foundAdmin.id, Owner.ADMIN, jti, hashedNewRefreshToken, this.config.jwtRefreshTokenTtl)

        return { accessToken: newAccessToken, refreshToken: newRefreshToken }
    }
}
