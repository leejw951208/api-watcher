import {
    ApiExceptionResponse,
    ApiOkBaseResponse,
    AUTH_ERROR,
    BaseException,
    CustomThrottlerGuard,
    JwtRefreshGuard,
    Public,
    ResponseDto,
    THROTTLER_ERROR,
    USER_ERROR
} from '@libs/common'
import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { PasswordResetConfirmRequestDto } from './dto/password-reset-confirm.request.dto'
import { PasswordResetInitRequestDto } from './dto/password-reset-init.request.dto'
import { PasswordResetInitResponseDto } from './dto/password-reset-init.response.dto'
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto'
import { SigninRequestDto } from './dto/signin-request.dto'
import { SigninResponseDto } from './dto/signin-response.dto'
import { SignupRequestDto } from './dto/signup-request.dto'

@ApiTags('auth')
@ApiBearerAuth('JWT-Auth')
@UseGuards(CustomThrottlerGuard)
@Controller({ path: 'auth', version: '1' })
export class AuthController {
    constructor(private readonly service: AuthService) {}

    @ApiOperation({ summary: '회원가입' })
    @ApiBody({ type: SignupRequestDto })
    @ApiCreatedResponse({ description: '회원가입 성공' })
    @ApiExceptionResponse(USER_ERROR.ALREADY_EXISTS_EMAIL)
    @HttpCode(HttpStatus.CREATED)
    @Public()
    @Post('signup')
    async signup(@Body() reqDto: SignupRequestDto): Promise<void> {
        await this.service.signup(reqDto)
    }

    @ApiOperation({
        summary: '로그인',
        description: '리프레시 토큰은 무조건 쿠키에 저장하고, 앱은 쿠키에 저장된 리프레시 토큰을 읽어 필요시 헤더로 전달'
    })
    @ApiBody({ type: SigninRequestDto })
    @ApiOkBaseResponse({ type: SigninResponseDto })
    @ApiExceptionResponse([USER_ERROR.NOT_FOUND, AUTH_ERROR.PASSWORD_NOT_MATCHED])
    @Public()
    @Post('signin')
    async signin(@Body() reqDto: SigninRequestDto, @Res({ passthrough: true }) res: Response): Promise<ResponseDto<SigninResponseDto>> {
        const result = await this.service.signin(reqDto)
        this.setRefreshToken(res, result.refreshToken)
        return new ResponseDto(result.resDto)
    }

    @ApiOperation({
        summary: '로그아웃',
        description:
            '웹: 서버에서 쿠키에 저장된 리프레시 토큰 사용 / 앱: 헤더에 리프레시 토큰을 담아서 전달하고, 서버에서 헤더를 파싱하여 사용'
    })
    @ApiNoContentResponse({ description: '로그아웃 성공' })
    @ApiExceptionResponse(AUTH_ERROR.MISSING_REFRESH_TOKEN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('signout')
    async signout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
        const refreshToken = this.extractRefreshToken(req)
        // 서버 측 토큰 무효화가 성공한 후 쿠키 제거
        // 순서를 바꾸면 서버 삭제 실패 시에도 클라이언트 쿠키가 소멸되어 재시도 불가
        await this.service.signout(refreshToken)
        this.removeRefreshToken(res)
    }

    @ApiOperation({
        summary: '토큰 재발급',
        description:
            '웹: 서버에서 쿠키에 저장된 리프레시 토큰 사용 / 앱: 헤더에 리프레시 토큰을 담아서 전달하고, 서버에서 헤더를 파싱하여 사용'
    })
    @ApiOkBaseResponse({ type: RefreshTokenResponseDto })
    @ApiExceptionResponse([USER_ERROR.NOT_FOUND, AUTH_ERROR.MISSING_REFRESH_TOKEN, AUTH_ERROR.INVALID_REFRESH_TOKEN])
    @UseGuards(JwtRefreshGuard)
    @Public()
    @Post('token/refresh')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ResponseDto<RefreshTokenResponseDto>> {
        const refreshToken = this.extractRefreshToken(req)
        const result = await this.service.refreshToken(refreshToken)
        this.setRefreshToken(res, result.refreshToken)
        return new ResponseDto(result.resDto)
    }

    @ApiOperation({
        summary: '비밀번호 재설정 요청',
        description: '이메일과 휴대폰번호를 확인하여 비밀번호 재설정 토큰을 발급합니다. 재설정 토큰은 15분간 유효합니다.'
    })
    @ApiBody({ type: PasswordResetInitRequestDto })
    @ApiOkBaseResponse({ type: PasswordResetInitResponseDto })
    @ApiExceptionResponse([USER_ERROR.VERIFICATION_FAILED, THROTTLER_ERROR.RATE_LIMIT_EXCEEDED])
    @Throttle({ ip: { limit: 5, ttl: 300000 } })
    @Public()
    @Post('password-reset/request')
    async requestPasswordReset(@Body() reqDto: PasswordResetInitRequestDto): Promise<ResponseDto<PasswordResetInitResponseDto>> {
        const result = await this.service.requestPasswordReset(reqDto)
        return new ResponseDto(result)
    }

    @ApiOperation({
        summary: '비밀번호 재설정',
        description: '재설정 토큰을 사용하여 새 비밀번호로 변경합니다.'
    })
    @ApiBody({ type: PasswordResetConfirmRequestDto })
    @ApiNoContentResponse({ description: '비밀번호 재설정 성공' })
    @ApiExceptionResponse([AUTH_ERROR.INVALID_RESET_TOKEN, USER_ERROR.NOT_FOUND])
    @HttpCode(HttpStatus.NO_CONTENT)
    @Public()
    @Patch('password-reset')
    async resetPassword(@Body() reqDto: PasswordResetConfirmRequestDto): Promise<void> {
        await this.service.resetPassword(reqDto)
    }

    private setRefreshToken(res: Response, refreshToken: string) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: 'strict',
            path: '/'
        })
    }

    private removeRefreshToken(res: Response) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/'
        })
    }

    private extractRefreshToken(req: Request): string {
        const fromCookie = req.cookies?.refreshToken as string | undefined
        if (fromCookie) return fromCookie

        const auth = req.headers.authorization
        const refreshToken = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined
        if (refreshToken) return refreshToken

        throw new BaseException(AUTH_ERROR.MISSING_REFRESH_TOKEN, this.constructor.name)
    }
}
