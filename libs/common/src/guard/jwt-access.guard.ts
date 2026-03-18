import { ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import { IS_PUBLIC_KEY } from '../decorator/public.decorator'
import { BaseException } from '../exception/base.exception'
import { AUTH_ERROR } from '../exception/exception.code'

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
    constructor(private reflector: Reflector) {
        super()
    }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // @Public() 데코레이터가 있는지 확인하고 있으면 검증 예외
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])
        if (isPublic) return true

        // JWT Strategy로 토큰 검증을 위임
        return super.canActivate(context)
    }

    /**
     *
     * @param err Passport에서 발생한 에러
     * @param payload Strategy에서 반환한 토큰 정보
     * @param info JWT 만료, 서명 오류 같은 추가 정보(JsonWebTokenError, TokenExpiredError)
     * @returns
     */
    handleRequest(err: any, payload: any, info: any) {
        if (err) throw new BaseException(AUTH_ERROR.INVALID_ACCESS_TOKEN, this.constructor.name)

        const name = info?.name as string | undefined
        if (name === 'TokenExpiredError') throw new BaseException(AUTH_ERROR.EXPIRED_ACCESS_TOKEN, this.constructor.name)
        if (name === 'JsonWebTokenError' || name === 'NotBeforeError')
            throw new BaseException(AUTH_ERROR.INVALID_ACCESS_TOKEN, this.constructor.name)

        if (!payload) throw new BaseException(AUTH_ERROR.MISSING_ACCESS_TOKEN, this.constructor.name)
        if (payload.type !== 'ac') throw new BaseException(AUTH_ERROR.INVALID_ACCESS_TOKEN, this.constructor.name)

        return payload
    }
}
