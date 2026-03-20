import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '../redis'
import { CustomThrottlerStorage } from './custom-throttler.storage'

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            inject: [REDIS_CLIENT],
            useFactory: (redis: Redis) => ({
                throttlers: [
                    { name: 'ip', ttl: 60000, limit: 10000 }, // 기본 전역 설정
                    { name: 'user', ttl: 60000, limit: 10000 } // 기본 전역 설정
                ],
                storage: new CustomThrottlerStorage(redis)
            })
        })
    ],
    exports: [ThrottlerModule]
})
export class CustomThrottlerModule {}
