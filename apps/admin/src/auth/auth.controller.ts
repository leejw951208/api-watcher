import {
    ApiExceptionResponse,
    ApiOkBaseResponse,
    AUTH_ERROR,
    BaseException,
    JwtRefreshGuard,
    Public,
    ResponseDto,
    USER_ERROR
} from '@libs/common'
import { Controller, Delete, HttpCode, HttpStatus, Post, Req, Res, UseGuards, Body } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'
import { AdminAuthService } from './auth.service'
import { AdminSigninRequestDto } from './dto/admin-signin-request.dto'
import { AdminSigninResponseDto } from './dto/admin-signin-response.dto'

@ApiTags('auth')
@ApiBearerAuth('JWT-Auth')
@Controller({ path: 'auth', version: '1' })
export class AdminAuthController {
    constructor(private readonly service: AdminAuthService) {}

    @ApiOperation({ summary: '관리자 로그인' })
    @ApiBody({ type: AdminSigninRequestDto })
    @ApiOkBaseResponse({ type: AdminSigninResponseDto })
    @ApiExceptionResponse([USER_ERROR.NOT_FOUND, AUTH_ERROR.PASSWORD_NOT_MATCHED])
    @Public()
    @Post('signin')
    async signin(
        @Body() reqDto: AdminSigninRequestDto,
        @Res({ passthrough: true }) res: Response
    ): Promise<ResponseDto<AdminSigninResponseDto>> {
        const result = await this.service.signin(reqDto)
        this.setRefreshToken(res, result.refreshToken)
        return new ResponseDto(result.resDto)
    }

    @ApiOperation({ summary: '관리자 로그아웃' })
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

    @ApiOperation({ summary: '관리자 토큰 재발급' })
    @ApiExceptionResponse([USER_ERROR.NOT_FOUND, AUTH_ERROR.MISSING_REFRESH_TOKEN, AUTH_ERROR.INVALID_REFRESH_TOKEN])
    @UseGuards(JwtRefreshGuard)
    @Public()
    @Post('token/refresh')
    async refreshToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ResponseDto<{ accessToken: string }>> {
        const refreshToken = this.extractRefreshToken(req)
        const result = await this.service.refreshToken(refreshToken)
        this.setRefreshToken(res, result.refreshToken)
        return new ResponseDto({ accessToken: result.accessToken })
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
