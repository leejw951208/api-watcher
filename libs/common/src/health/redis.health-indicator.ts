import { Inject, Injectable } from '@nestjs/common'
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '../redis'

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
        super()
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const result = await this.redis.ping()
        const isHealthy = result === 'PONG'

        if (isHealthy) {
            return this.getStatus(key, true)
        }

        throw new HealthCheckError('Redis check failed', this.getStatus(key, false))
    }
}
