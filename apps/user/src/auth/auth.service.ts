import { AUTH_ERROR, BaseException, commonEnvConfig, CryptoService, REDIS_CLIENT, TokenService, USER_ERROR } from '@libs/common'
import { Owner, UserStatus } from '@libs/prisma'
import { Inject, Injectable } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import { plainToInstance } from 'class-transformer'
import { randomBytes, randomUUID } from 'crypto'
import Redis from 'ioredis'
import { UserResponseDto } from '../user/dto/user-response.dto'
import { UserRepository } from '../user/user.repository'
import { PasswordResetConfirmRequestDto } from './dto/password-reset-confirm.request.dto'
import { PasswordResetInitRequestDto } from './dto/password-reset-init.request.dto'
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto'
import { SigninRequestDto } from './dto/signin-request.dto'
import { SigninResponseDto } from './dto/signin-response.dto'
import { SignupRequestDto } from './dto/signup-request.dto'

// 서비스 주입 가능(Injectable) 데코레이터: 이 클래스가 NestJS IoC 컨테이너에 의해 관리되는 서비스임을 나타냅니다.
@Injectable()
export class AuthService {
    // 비밀번호 재설정 토큰 캐시 키 접두사
    private readonly PASSWORD_RESET_TOKEN_PREFIX = 'password-reset:token:'
    // 비밀번호 재설정 요청 횟수 제한 캐시 키 접두사
    private readonly PASSWORD_RESET_RATE_PREFIX = 'password-reset:rate:'
    // 비밀번호 재설정 토큰 유효 시간 (초)
    private readonly PASSWORD_RESET_TOKEN_TTL = 300 // 5분
    // 비밀번호 재설정 요청 횟수 제한
    private readonly PASSWORD_RESET_RATE_LIMIT = 5
    // 비밀번호 재설정 요청 횟수 제한 윈도우 (초)
    private readonly PASSWORD_RESET_RATE_WINDOW = 300 // 5분

    constructor(
        private readonly userRepository: UserRepository,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>,
        private readonly cryptoService: CryptoService,
        private readonly tokenService: TokenService
    ) {}

    /**
     * @summary 사용자 회원가입
     * @description 제공된 정보를 사용하여 새로운 사용자를 생성하고 비밀번호를 해싱하여 저장합니다.
     * @param reqDto 회원가입 요청 데이터 (이메일, 비밀번호 등)
     * @returns Promise<void>
     * @throws {BaseException} 이미 존재하는 이메일인 경우 USER_ERROR.ALREADY_EXISTS_EMAIL 에러 발생
     */
    async signup(reqDto: SignupRequestDto): Promise<void> {
        // 1. 이미 존재하는 이메일인지 확인
        const exists = await this.userRepository.existsByEmail(reqDto.email)
        // 2. 이미 존재하면 에러 발생
        if (exists) throw new BaseException(USER_ERROR.ALREADY_EXISTS_EMAIL, this.constructor.name)

        // 3. 비밀번호 해싱
        const hashedPassword = await this.cryptoService.hash(reqDto.password)
        // 4. 사용자 생성
        await this.userRepository.create({
            ...reqDto,
            password: hashedPassword,
            status: UserStatus.ACTIVE
        })
    }

    /**
     * @summary 사용자 로그인
     * @description 사용자 이메일과 비밀번호를 검증하고, 액세스 토큰 및 리프레시 토큰을 발급합니다.
     * @param reqDto 로그인 요청 데이터 (이메일, 비밀번호)
     * @returns {Promise<{ resDto: SigninResponseDto; refreshToken: string }>} 생성된 액세스 토큰, 사용자 정보, 리프레시 토큰을 포함하는 객체
     * @throws {BaseException} 사용자를 찾을 수 없는 경우 USER_ERROR.NOT_FOUND 에러 발생
     * @throws {BaseException} 비밀번호가 일치하지 않는 경우 AUTH_ERROR.PASSWORD_NOT_MATCHED 에러 발생
     */
    async signin(reqDto: SigninRequestDto): Promise<{ resDto: SigninResponseDto; refreshToken: string }> {
        // 1. 이메일로 사용자 찾기
        const foundUser = await this.userRepository.findByEmail(reqDto.email)
        // 사용자가 존재하지 않으면 에러 발생
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        // 2. 비밀번호 일치 여부 확인
        const isMatched = await this.cryptoService.compare(reqDto.password, foundUser.password)
        // 비밀번호가 일치하지 않으면 에러 발생
        if (!isMatched) throw new BaseException(AUTH_ERROR.PASSWORD_NOT_MATCHED, this.constructor.name)

        // 3. JTI (JWT ID) 생성 및 토큰 발급
        const jti = randomUUID() // JWT 고유 ID
        // 액세스 토큰과 리프레시 토큰을 병렬로 생성
        const [accessToken, refreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundUser.id, Owner.USER, jti),
            this.tokenService.createRefreshToken(foundUser.id, Owner.USER, jti)
        ])

        // 4. 리프레시 토큰 해싱 및 저장
        const hashedRefreshToken = await this.cryptoService.hash(refreshToken)
        await this.tokenService.saveRefreshToken(foundUser.id, Owner.USER, jti, hashedRefreshToken, this.config.jwtRefreshTokenTtl)

        // 5. 응답 DTO 생성
        const resDto = plainToInstance(
            SigninResponseDto,
            {
                accessToken,
                user: plainToInstance(UserResponseDto, foundUser, { excludeExtraneousValues: true }) // 사용자 정보를 DTO로 변환
            },
            { excludeExtraneousValues: true }
        )

        // 6. 결과 반환
        return { resDto, refreshToken }
    }

    /**
     * @summary 사용자 로그아웃
     * @description 제공된 리프레시 토큰을 검증하고, 해당 리프레시 토큰을 삭제하여 로그아웃 처리합니다.
     * @param refreshToken 사용자의 리프레시 토큰
     * @returns Promise<void>
     * @throws {BaseException} 사용자를 찾을 수 없는 경우 USER_ERROR.NOT_FOUND 에러 발생
     */
    async signout(refreshToken: string): Promise<void> {
        // 1. 리프레시 토큰 검증하여 페이로드 추출
        const payload = await this.tokenService.verify(refreshToken, 're')

        // 2. 페이로드의 ID로 사용자 찾기
        const foundUser = await this.userRepository.findById(payload.id)
        // 사용자를 찾을 수 없으면 에러 발생
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        // 3. 해당 리프레시 토큰 삭제
        await this.tokenService.deleteRefreshToken(foundUser.id, Owner.USER, payload.jti)
    }

    /**
     * @summary 토큰 재발급
     * @description 만료된 액세스 토큰을 새로운 액세스 토큰과 리프레시 토큰으로 재발급합니다.
     * @param refreshToken 기존 리프레시 토큰
     * @returns {Promise<{ resDto: RefreshTokenResponseDto; refreshToken: string }>} 새로운 액세스 토큰과 리프레시 토큰을 포함하는 객체
     * @throws {BaseException} 사용자를 찾을 수 없는 경우 USER_ERROR.NOT_FOUND 에러 발생
     * @throws {BaseException} 캐시에 리프레시 토큰이 없는 경우 AUTH_ERROR.MISSING_REFRESH_TOKEN 에러 발생
     * @throws {BaseException} 기존 리프레시 토큰이 유효하지 않은 경우 AUTH_ERROR.INVALID_REFRESH_TOKEN 에러 발생
     */
    async refreshToken(refreshToken: string): Promise<{ resDto: RefreshTokenResponseDto; refreshToken: string }> {
        // 1. 기존 리프레시 토큰 검증하여 페이로드 추출
        const payload = await this.tokenService.verify(refreshToken, 're')

        // 2. 페이로드의 ID로 사용자 찾기
        const foundUser = await this.userRepository.findById(payload.id)
        // 사용자를 찾을 수 없으면 에러 발생
        if (!foundUser) throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)

        // 3. 캐시에서 저장된 리프레시 토큰 가져오기
        const foundCachedToken = await this.tokenService.getRefreshToken(foundUser.id, Owner.USER, payload.jti)
        // 캐시에 토큰이 없으면 에러 발생 (만료되었거나 이미 사용됨)
        if (!foundCachedToken) throw new BaseException(AUTH_ERROR.MISSING_REFRESH_TOKEN, this.constructor.name)

        // 4. 기존 리프레시 토큰과 캐시된 토큰 비교
        const isMatched = await this.cryptoService.compare(refreshToken, foundCachedToken)
        // 토큰이 일치하지 않으면 에러 발생
        if (!isMatched) throw new BaseException(AUTH_ERROR.INVALID_REFRESH_TOKEN, this.constructor.name)

        // 5. 기존 리프레시 토큰 삭제 (일회용 토큰이므로)
        await this.tokenService.deleteRefreshToken(foundUser.id, Owner.USER, payload.jti)

        // 6. 새로운 JTI 생성 및 새 토큰 발급
        const jti = randomUUID()
        const [newAccessToken, newRefreshToken] = await Promise.all([
            this.tokenService.createAccessToken(foundUser.id, Owner.USER, jti),
            this.tokenService.createRefreshToken(foundUser.id, Owner.USER, jti)
        ])

        // 7. 새로운 리프레시 토큰 해싱 및 저장
        const hashedNewRefreshToken = await this.cryptoService.hash(newRefreshToken)
        await this.tokenService.saveRefreshToken(foundUser.id, Owner.USER, jti, hashedNewRefreshToken, this.config.jwtRefreshTokenTtl)

        // 8. 결과 반환
        return {
            resDto: plainToInstance(RefreshTokenResponseDto, { accessToken: newAccessToken }),
            refreshToken: newRefreshToken
        }
    }

    /**
     * @summary 비밀번호 재설정 요청
     * @description 이메일과 휴대폰번호를 확인하여 비밀번호 재설정 토큰을 발급합니다.
     * @param reqDto 비밀번호 재설정 요청 데이터 (이메일, 휴대폰번호)
     * @returns {{ resetToken: string }} 비밀번호 재설정 토큰
     * @throws {BaseException} 이메일과 휴대폰번호가 일치하는 사용자가 없는 경우 USER_ERROR.VERIFICATION_FAILED 에러 발생
     */
    async requestPasswordReset(reqDto: PasswordResetInitRequestDto): Promise<{ resetToken: string }> {
        const normalizedEmail = reqDto.email.trim().toLowerCase()

        // 이메일 기준 요청 횟수 제한
        const rateKey = `${this.PASSWORD_RESET_RATE_PREFIX}${normalizedEmail}`
        const count = await this.redis.incr(rateKey)
        if (count === 1) {
            await this.redis.expire(rateKey, this.PASSWORD_RESET_RATE_WINDOW)
        }
        if (count > this.PASSWORD_RESET_RATE_LIMIT) {
            throw new BaseException(AUTH_ERROR.RATE_LIMIT_EXCEEDED, this.constructor.name)
        }

        const user = await this.userRepository.findByEmailAndPhone(normalizedEmail, reqDto.phone)

        if (!user) {
            throw new BaseException(USER_ERROR.VERIFICATION_FAILED, this.constructor.name)
        }

        const resetToken = randomBytes(16).toString('hex')
        await this.redis.set(`${this.PASSWORD_RESET_TOKEN_PREFIX}${resetToken}`, String(user.id), 'EX', this.PASSWORD_RESET_TOKEN_TTL)

        return { resetToken }
    }

    /**
     * @summary 비밀번호 재설정
     * @description 제공된 재설정 토큰과 새로운 비밀번호를 사용하여 사용자 비밀번호를 업데이트합니다.
     * @param reqDto 비밀번호 재설정 확인 요청 데이터 (리셋 토큰, 새로운 비밀번호)
     * @returns Promise<void>
     * @throws {BaseException} 재설정 토큰이 유효하지 않은 경우 AUTH_ERROR.INVALID_RESET_TOKEN 에러 발생
     * @throws {BaseException} 사용자를 찾을 수 없는 경우 USER_ERROR.NOT_FOUND 에러 발생
     */
    async resetPassword(reqDto: PasswordResetConfirmRequestDto): Promise<void> {
        const { resetToken, newPassword } = reqDto

        // 1. 캐시에서 재설정 토큰에 해당하는 사용자 ID 가져오기
        const tokenKey = `${this.PASSWORD_RESET_TOKEN_PREFIX}${resetToken}`
        const userIdStr = await this.redis.get(tokenKey)
        const userId = userIdStr ? Number(userIdStr) : null

        // 2. 사용자 ID가 없으면 유효하지 않은 토큰 에러 발생
        if (!userId) {
            throw new BaseException(AUTH_ERROR.INVALID_RESET_TOKEN, this.constructor.name)
        }

        // 3. 사용자 ID로 사용자 찾기
        const user = await this.userRepository.findById(userId)
        // 사용자를 찾을 수 없으면 에러 발생
        if (!user) {
            throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
        }

        // 4. 새로운 비밀번호 해싱
        const hashedPassword = await this.cryptoService.hash(newPassword)

        // 5. 사용자 비밀번호 업데이트 후 재설정 토큰 삭제
        // DB 변경을 먼저 수행해야 redis.del 성공 후 updatePassword 실패 시
        // 토큰이 소멸되어 재시도가 불가능해지는 상황을 방지할 수 있음
        await this.userRepository.updatePassword(user.id, hashedPassword)
        await this.redis.del(tokenKey)

        // 6. 해당 사용자의 모든 리프레시 토큰 삭제 (보안 강화)
        await this.tokenService.deleteAllRefreshTokens(user.id, Owner.USER)
    }
}
