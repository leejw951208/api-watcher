import { AUTH_ERROR, BaseException, commonEnvConfig, CryptoService, EmailService, REDIS_CLIENT, TokenService, USER_ERROR } from '@libs/common'
import { Owner, UserStatus } from '@libs/prisma'
import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { plainToInstance } from 'class-transformer'
import { createHash, randomBytes, randomUUID } from 'crypto'
import Redis from 'ioredis'
import { UserResponseDto } from '../user/dto/user-response.dto'
import { UserRepository } from '../user/user.repository'
import { PasswordResetConfirmRequestDto } from './dto/password-reset-confirm.request.dto'
import { PasswordResetInitRequestDto } from './dto/password-reset-init.request.dto'
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto'
import { SigninRequestDto } from './dto/signin-request.dto'
import { SigninResponseDto } from './dto/signin-response.dto'
import { SignupRequestDto } from './dto/signup-request.dto'

@Injectable()
export class AuthService {
    // 비밀번호 재설정 토큰 캐시 키 접두사 (SHA-256 해시값을 키로 사용)
    private readonly PASSWORD_RESET_TOKEN_PREFIX = 'password-reset:token:'
    // 비밀번호 재설정 요청 횟수 제한 캐시 키 접두사 (이메일 기준)
    private readonly PASSWORD_RESET_RATE_EMAIL_PREFIX = 'password-reset:rate:email:'
    // 비밀번호 재설정 요청 횟수 제한 캐시 키 접두사 (IP 기준)
    private readonly PASSWORD_RESET_RATE_IP_PREFIX = 'password-reset:rate:ip:'
    // 비밀번호 재설정 토큰 유효 시간 (초): 30분
    private readonly PASSWORD_RESET_TOKEN_TTL = 1800
    // 이메일 기준 요청 횟수 제한: 1시간에 3회
    private readonly PASSWORD_RESET_EMAIL_RATE_LIMIT = 3
    // IP 기준 요청 횟수 제한: 1시간에 5회
    private readonly PASSWORD_RESET_IP_RATE_LIMIT = 5
    // Rate limit 윈도우 (초): 1시간
    private readonly PASSWORD_RESET_RATE_WINDOW = 3600

    constructor(
        private readonly userRepository: UserRepository,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>,
        private readonly cryptoService: CryptoService,
        private readonly tokenService: TokenService,
        private readonly emailService: EmailService
    ) {}

    /**
     * @summary 사용자 회원가입
     * @description 제공된 정보를 사용하여 새로운 사용자를 생성하고 비밀번호를 해싱하여 저장합니다.
     */
    async signup(reqDto: SignupRequestDto): Promise<void> {
        const exists = await this.userRepository.existsByEmail(reqDto.email)
        if (exists) throw new BaseException(USER_ERROR.ALREADY_EXISTS_EMAIL, this.constructor.name)

        const hashedPassword = await this.cryptoService.hash(reqDto.password)
        await this.userRepository.create({
            ...reqDto,
            password: hashedPassword,
            status: UserStatus.ACTIVE
        })
    }

    /**
     * @summary 사용자 로그인
     * @description 사용자 이메일과 비밀번호를 검증하고, 액세스 토큰 및 리프레시 토큰을 발급합니다.
     */
    async signin(reqDto: SigninRequestDto): Promise<{ resDto: SigninResponseDto; refreshToken: string }> {
        const foundUser = await this.userRepository.findByEmail(reqDto.email)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        const isMatched = await this.cryptoService.compare(reqDto.password, foundUser.password)
        if (!isMatched) throw new BaseException(AUTH_ERROR.PASSWORD_NOT_MATCHED, this.constructor.name)

        const jti = randomUUID()
        const [accessToken, refreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundUser.id, Owner.USER, jti),
            this.tokenService.createRefreshToken(foundUser.id, Owner.USER, jti)
        ])

        const hashedRefreshToken = await this.cryptoService.hash(refreshToken)
        await this.tokenService.saveRefreshToken(foundUser.id, Owner.USER, jti, hashedRefreshToken, this.config.jwtRefreshTokenTtl)

        const resDto = plainToInstance(
            SigninResponseDto,
            {
                accessToken,
                user: plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true })
            },
            { excludeExtraneousValues: true }
        )

        return { resDto, refreshToken }
    }

    /**
     * @summary 사용자 로그아웃
     * @description 제공된 리프레시 토큰을 검증하고, 해당 리프레시 토큰을 삭제하여 로그아웃 처리합니다.
     */
    async signout(refreshToken: string): Promise<void> {
        const payload = await this.tokenService.verify(refreshToken, 're')

        const foundUser = await this.userRepository.findById(payload.id)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        await this.tokenService.deleteRefreshToken(foundUser.id, Owner.USER, payload.jti)
    }

    /**
     * @summary 토큰 재발급
     * @description 만료된 액세스 토큰을 새로운 액세스 토큰과 리프레시 토큰으로 재발급합니다. (Token Rotation)
     */
    async refreshToken(refreshToken: string): Promise<{ resDto: RefreshTokenResponseDto; refreshToken: string }> {
        const payload = await this.tokenService.verify(refreshToken, 're')

        const foundUser = await this.userRepository.findById(payload.id)
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        const foundCachedToken = await this.tokenService.getRefreshToken(foundUser.id, Owner.USER, payload.jti)
        if (!foundCachedToken) throw new BaseException(AUTH_ERROR.MISSING_REFRESH_TOKEN, this.constructor.name)

        const isMatched = await this.cryptoService.compare(refreshToken, foundCachedToken)
        if (!isMatched) throw new BaseException(AUTH_ERROR.INVALID_REFRESH_TOKEN, this.constructor.name)

        await this.tokenService.deleteRefreshToken(foundUser.id, Owner.USER, payload.jti)

        const jti = randomUUID()
        const [newAccessToken, newRefreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundUser.id, Owner.USER, jti),
            this.tokenService.createRefreshToken(foundUser.id, Owner.USER, jti)
        ])

        const hashedNewRefreshToken = await this.cryptoService.hash(newRefreshToken)
        await this.tokenService.saveRefreshToken(foundUser.id, Owner.USER, jti, hashedNewRefreshToken, this.config.jwtRefreshTokenTtl)

        return {
            resDto: plainToInstance(RefreshTokenResponseDto, { accessToken: newAccessToken }),
            refreshToken: newRefreshToken
        }
    }

    /**
     * @summary 비밀번호 재설정 요청
     * @description 이메일로 매직 링크를 발송합니다.
     *              계정 열거 공격 방지를 위해 이메일 존재 여부와 관계없이 항상 동일한 응답을 반환합니다.
     *              재설정 토큰 원본은 이메일로만 전달되며, SHA-256 해시값만 Redis에 저장합니다.
     */
    async requestPasswordReset(reqDto: PasswordResetInitRequestDto, ip: string): Promise<void> {
        const normalizedEmail = reqDto.email.trim().toLowerCase()

        // IP 기준 Rate Limit 확인
        await this.checkRateLimit(
            `${this.PASSWORD_RESET_RATE_IP_PREFIX}${ip}`,
            this.PASSWORD_RESET_IP_RATE_LIMIT,
            this.PASSWORD_RESET_RATE_WINDOW
        )

        // 이메일 기준 Rate Limit 확인
        await this.checkRateLimit(
            `${this.PASSWORD_RESET_RATE_EMAIL_PREFIX}${normalizedEmail}`,
            this.PASSWORD_RESET_EMAIL_RATE_LIMIT,
            this.PASSWORD_RESET_RATE_WINDOW
        )

        // 사용자가 존재하는 경우에만 내부 처리 (존재 여부는 응답으로 노출하지 않음)
        const user = await this.userRepository.findByEmail(normalizedEmail)
        if (user) {
            // 32바이트 랜덤 토큰 생성 (64자 hex)
            const resetToken = randomBytes(32).toString('hex')
            // Redis에는 SHA-256 해시값만 저장 (원본 토큰 미저장)
            const tokenHash = this.hashToken(resetToken)
            await this.redis.set(`${this.PASSWORD_RESET_TOKEN_PREFIX}${tokenHash}`, String(user.id), 'EX', this.PASSWORD_RESET_TOKEN_TTL)

            // 매직 링크 생성 후 이메일 발송
            const resetLink = `${this.config.appBaseUrl}/password-reset?token=${resetToken}`
            await this.emailService.sendPasswordResetEmail(normalizedEmail, resetLink)
        }
    }

    /**
     * @summary 비밀번호 재설정 토큰 유효성 검증
     * @description 프론트엔드에서 비밀번호 입력 폼 진입 전 토큰 유효성을 확인합니다.
     *              토큰을 소비하지 않습니다 (단순 조회만).
     */
    async verifyPasswordResetToken(token: string): Promise<void> {
        const tokenHash = this.hashToken(token)
        const userId = await this.redis.get(`${this.PASSWORD_RESET_TOKEN_PREFIX}${tokenHash}`)
        if (!userId) throw new BaseException(AUTH_ERROR.INVALID_RESET_TOKEN, this.constructor.name)
    }

    /**
     * @summary 비밀번호 재설정
     * @description 재설정 토큰을 검증하고 새 비밀번호로 변경합니다.
     *              토큰은 단일 사용이므로 검증 즉시 Redis에서 삭제합니다.
     *              비밀번호 변경 후 전 기기 세션을 강제 종료하고 알림 이메일을 발송합니다.
     */
    async resetPassword(reqDto: PasswordResetConfirmRequestDto): Promise<void> {
        const { resetToken, newPassword } = reqDto

        const tokenHash = this.hashToken(resetToken)
        const tokenKey = `${this.PASSWORD_RESET_TOKEN_PREFIX}${tokenHash}`
        const userIdStr = await this.redis.get(tokenKey)
        const userId = userIdStr ? Number(userIdStr) : null

        if (!userId) throw new BaseException(AUTH_ERROR.INVALID_RESET_TOKEN, this.constructor.name)

        const user = await this.userRepository.findById(userId)
        if (!user) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        // 토큰 즉시 삭제 (단일 사용 보장) → 비밀번호 업데이트보다 먼저 삭제
        // 토큰 삭제 후 비밀번호 업데이트 실패 시 재설정을 재요청해야 하지만,
        // 반대 순서에서 업데이트 성공 후 토큰 삭제 실패 시 토큰 재사용이 가능하므로 현재 순서가 더 안전합니다.
        await this.redis.del(tokenKey)

        const hashedPassword = await this.cryptoService.hash(newPassword)
        await this.userRepository.updatePassword(user.id, hashedPassword)

        // 전 기기 Refresh Token 무효화 (강제 로그아웃)
        await this.tokenService.deleteAllRefreshTokens(user.id, Owner.USER)

        // 비밀번호 변경 알림 이메일 발송
        await this.emailService.sendPasswordChangedEmail(user.email)
    }

    /**
     * 토큰을 SHA-256으로 해싱합니다. Redis 탈취 시 원본 토큰 복원을 방지합니다.
     */
    private hashToken(token: string): string {
        return createHash('sha256').update(token).digest('hex')
    }

    /**
     * Redis 기반 Rate Limit 확인. 초과 시 AUTH_ERROR.RATE_LIMIT_EXCEEDED를 발생시킵니다.
     */
    private async checkRateLimit(key: string, limit: number, windowSec: number): Promise<void> {
        const count = await this.redis.incr(key)
        if (count === 1) await this.redis.expire(key, windowSec)
        if (count > limit) throw new BaseException(AUTH_ERROR.RATE_LIMIT_EXCEEDED, this.constructor.name)
    }
}
