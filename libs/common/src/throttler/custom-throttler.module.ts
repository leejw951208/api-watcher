import { Module } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { commonEnvConfig } from '../config'
import { CustomThrottlerStorage } from './custom-throttler.storage'

@Module({
    imports: [
        ThrottlerModule.forRootAsync({
            inject: [commonEnvConfig.KEY],
            useFactory: (config: ConfigType<typeof commonEnvConfig>) => ({
                throttlers: [
                    { name: 'ip', ttl: 60000, limit: 10000 }, // 기본 전역 설정
                    { name: 'user', ttl: 60000, limit: 10000 } // 기본 전역 설정
                ],
                storage: new CustomThrottlerStorage(config)
            })
        })
    ],
    exports: [ThrottlerModule]
})
export class CustomThrottlerModule {}
