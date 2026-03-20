import { PrismaService } from '@libs/prisma'
import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import Redis from 'ioredis'
import { REDIS_CLIENT } from '../redis'
import { WebhookDispatchService } from '../webhook/webhook-dispatch.service'

@Injectable()
export class MonitoringAlertService {
    private readonly logger = new Logger(MonitoringAlertService.name)
    private readonly ALERT_COOLDOWN_TTL = 300

    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Optional() private readonly webhookDispatch?: WebhookDispatchService
    ) {}

    /**
     * 상태 변경 알림 생성 (userId 연결, Redis 중복 방지)
     */
    async sendAlert(endpointId: number, userId: number, type: 'DOWN' | 'UP' | 'SLOW', endpointName: string): Promise<void> {
        const redisKey = `monitoring:alert:${endpointId}:${type}`

        const exists = await this.redis.exists(redisKey)
        if (exists) {
            this.logger.debug(`알림 중복 방지: [${endpointName}] ${type}`)
            return
        }

        const titleMap = {
            DOWN: `[장애] ${endpointName} 서비스 다운`,
            UP: `[복구] ${endpointName} 서비스 복구`,
            SLOW: `[경고] ${endpointName} 응답 지연`
        }

        const contentMap = {
            DOWN: `${endpointName} 엔드포인트가 연속 실패하여 장애 상태로 전환되었습니다.`,
            UP: `${endpointName} 엔드포인트가 정상 복구되었습니다.`,
            SLOW: `${endpointName} 엔드포인트의 응답 시간이 임계값을 초과했습니다.`
        }

        await this.prisma.notification.create({
            data: {
                userId,
                title: titleMap[type],
                content: contentMap[type],
                type: 'MONITORING'
            }
        })

        await this.redis.setex(redisKey, this.ALERT_COOLDOWN_TTL, '1')
        this.logger.log(`알림 발송: [${endpointName}] ${type} → userId: ${userId}`)

        // 외부 Webhook 발송 (fire-and-forget, 스케줄러 블로킹 방지)
        if (this.webhookDispatch) {
            this.webhookDispatch.dispatchAll(userId, endpointId, type, endpointName).catch((err) => {
                this.logger.error(`Webhook 발송 실패: ${err.message}`)
            })
        }
    }
}
