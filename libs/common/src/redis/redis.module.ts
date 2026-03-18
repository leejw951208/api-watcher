import { DynamicModule, Logger, Module, Provider } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import Redis from 'ioredis'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { commonEnvConfig } from '../config'

export const REDIS_CLIENT = 'REDIS_CLIENT'

@Module({})
export class RedisModule {
    static forRootAsync(): DynamicModule {
        const redisProvider: Provider = {
            provide: REDIS_CLIENT,
            inject: [commonEnvConfig.KEY, WINSTON_MODULE_NEST_PROVIDER],
            useFactory: (config: ConfigType<typeof commonEnvConfig>, logger: Logger): Redis => {
                const redis = new Redis({
                    host: config.redisHost,
                    port: config.redisPort,
                    password: config.redisPassword || undefined,
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times) => {
                        if (times > 10) {
                            logger.error('Redis connection failed after 10 retries')
                            return null
                        }
                        const delay = Math.min(times * 1000, 3000)
                        logger.warn(`Redis retry attempt ${times}, next retry in ${delay}ms`)
                        return delay
                    }
                })

                redis.on('connect', () => {
                    logger.log('Redis connected')
                })

                redis.on('error', (err) => {
                    logger.error(`Redis error: ${err.message}`)
                })

                return redis
            }
        }

        return {
            module: RedisModule,
            global: true,
            providers: [redisProvider],
            exports: [REDIS_CLIENT]
        }
    }
}
