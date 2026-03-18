import { ExecutionContext, Injectable } from '@nestjs/common'
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler'
import { BaseException, THROTTLER_ERROR } from '../exception'

/**
 * 커스텀 Rate Limiting 가드
 *
 * - IP 기반 또는 사용자 기반으로 요청 횟수를 제한
 * - @Throttle({ ip: {...}, user: {...} }) 데코레이터와 함께 사용
 * - 'user' throttler: 인증된 사용자 ID 기준으로 제한
 * - 'ip' throttler: 클라이언트 IP 기준으로 제한
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    /**
     * 요청 처리 및 Rate Limit 검사
     * - Redis 스토리지에서 현재 요청 횟수를 조회/증가
     * - 제한 초과 시 예외 발생
     */
    protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
        const { context, throttler, limit, ttl, blockDuration, generateKey } = requestProps
        const { req, res } = this.getRequestResponse(context)

        // throttler 타입(ip/user)에 따라 추적 키 생성
        const tracker = await this.getTrackerByThrottler(req, throttler.name!)
        const key = generateKey(context, tracker, throttler.name!)

        // Redis에서 요청 횟수 증가 및 현재 상태 조회
        const { totalHits, timeToExpire, isBlocked, timeToBlockExpire } = await this.storageService.increment(
            key,
            ttl,
            limit,
            blockDuration,
            throttler.name!
        )

        // 제한 초과 시 429 Too Many Requests 예외 발생
        if (isBlocked) {
            await this.throwThrottlingException(context)
        }

        return true
    }

    /**
     * Throttler 타입에 따른 추적 키 생성
     * - 'user' throttler + 인증된 사용자: user:{userId}
     * - 그 외: ip:{clientIp}
     */
    private async getTrackerByThrottler(req: Record<string, any>, throttlerName: string): Promise<string> {
        const ip = this.getClientIp(req)

        // 'user' throttler이고 인증된 사용자인 경우 사용자 ID로 추적
        if (throttlerName === 'user' && req.user?.id) {
            return `user:${req.user.id}`
        }

        // 그 외에는 IP로 추적
        return `ip:${ip}`
    }

    /**
     * 클라이언트 실제 IP 추출
     * - main.ts의 trust proxy 설정 덕분에 Express가 X-Forwarded-For를 검증하고
     *   req.ip에 실제 클라이언트 IP를 담아줌 (헤더 직접 파싱 시 스푸핑 가능)
     */
    private getClientIp(req: Record<string, any>): string {
        return req.ip ?? req.socket?.remoteAddress ?? 'unknown'
    }

    /**
     * Rate Limit 초과 시 예외 발생
     */
    protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
        throw new BaseException(THROTTLER_ERROR.RATE_LIMIT_EXCEEDED, this.constructor.name)
    }
}
