import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { BaseException } from '../exception/base.exception'
import { AUTH_ERROR } from '../exception/exception.code'
import { JwtPayload } from '../service/token.service'

/**
 * JWT 인증 전략 - passport-jwt를 사용한 JWT 토큰 기반 인증
 *
 * 동작 과정:
 * 1. 클라이언트가 Authorization: Bearer <token> 헤더로 JWT 토큰 전송
 * 2. JwtGuard(@UseGuards(JwtGuard))가 이 전략을 실행
 * 3. passport-jwt가 ExtractJwt.fromAuthHeaderAsBearerToken()로 토큰 추출
 * 4. JWT_SECRET_KEY로 토큰 검증 (서명, 만료시간)
 * 5. 토큰이 유효하면 페이로드를 validate() 메서드에 전달
 * 6. validate()에서 추가 검증 수행 (토큰 타입, 키 검증)
 * 7. 검증 성공시 회원 PK 반환, 실패시 예외 발생
 *
 * super() 호출 이유:
 * - jwtFromRequest: Bearer 토큰에서 JWT 추출 방식 설정
 * - ignoreExpiration: false로 설정하여 만료된 토큰 거부
 * - secretOrKey: 토큰 서명 검증에 사용할 비밀키 설정
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET_KEY')!
        })
    }

    async validate(payload: JwtPayload) {
        // 토큰 발급자 검증
        if (payload.issuer !== 'monorepo') throw new BaseException(AUTH_ERROR.INVALID_ACCESS_TOKEN, this.constructor.name)
        return payload
    }
}
