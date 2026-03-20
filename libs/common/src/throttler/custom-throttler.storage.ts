import { Inject, Injectable } from '@nestjs/common'
import { ThrottlerStorage } from '@nestjs/throttler'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '../redis'

/**
 * Rate Limiting 결과 레코드
 */
interface ThrottlerStorageData {
    totalHits: number // 현재까지 요청 횟수
    timeToExpire: number // TTL 만료까지 남은 시간 (ms)
    isBlocked: boolean // 제한 초과 여부
    timeToBlockExpire: number // 차단 해제까지 남은 시간 (ms)
}

/**
 * Redis 기반 Throttler 스토리지
 *
 * 분산 환경에서 Rate Limiting을 위해 Redis를 사용
 * - 인메모리 스토리지는 단일 인스턴스에서만 동작
 * - Redis 사용 시 여러 서버 인스턴스가 동일한 카운트 공유
 *
 * INCR 명령어로 원자적(atomic) 카운트 증가 보장
 * cache-manager의 get/set 분리와 달리 Race Condition 없음
 */
@Injectable()
export class CustomThrottlerStorage implements ThrottlerStorage {
    private readonly keyPrefix = 'throttler'

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

    /**
     * 요청 횟수 증가 및 현재 상태 반환
     *
     * @param key - 추적 키 (예: "user:123" 또는 "ip:192.168.1.1")
     * @param ttl - Time To Live (밀리초)
     * @param limit - 최대 허용 요청 횟수
     * @param blockDuration - 차단 지속 시간 (현재 미사용)
     * @param throttlerName - throttler 이름 (ip, user 등)
     *
     * Redis 키 형식: throttler:{throttlerName}:{key}
     * 예: throttler:user:user:123, throttler:ip:ip:192.168.1.1
     */
    async increment(key: string, ttl: number, limit: number, blockDuration: number, throttlerName: string): Promise<ThrottlerStorageData> {
        const storageKey = `${this.keyPrefix}:${throttlerName}:${key}`

        // INCR: 원자적으로 값을 1 증가 (키가 없으면 0에서 시작)
        // 동시에 여러 요청이 들어와도 정확한 카운팅 보장
        const totalHits = await this.redis.incr(storageKey)

        // 첫 번째 요청일 때만 TTL 설정
        // PEXPIRE: 밀리초 단위로 만료 시간 설정
        if (totalHits === 1) {
            await this.redis.pexpire(storageKey, ttl)
        }

        // PTTL: 남은 만료 시간 조회 (밀리초)
        const timeToExpire = await this.redis.pttl(storageKey)

        return {
            totalHits,
            timeToExpire: Math.max(0, timeToExpire),
            isBlocked: totalHits > limit,
            timeToBlockExpire: 0
        }
    }
}
