import { AlertType, PrismaService } from '@libs/prisma'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { CryptoService } from '../service/crypto.service'
import { WebhookPayloadBuilder } from './webhook-payload.builder'

@Injectable()
export class WebhookDispatchService {
    private readonly logger = new Logger(WebhookDispatchService.name)
    private readonly MAX_RETRY = 3
    private readonly RETRY_DELAYS = [1000, 5000, 15000]

    constructor(
        // libs 계층에서 Repository 분리가 어려워 PrismaService 직접 사용
        private readonly prisma: PrismaService,
        private readonly crypto: CryptoService,
        private readonly httpService: HttpService
    ) {}

    /**
     * 사용자의 모든 활성 Webhook 채널로 알림을 비동기 발송
     */
    async dispatchAll(userId: number, endpointId: number, type: 'DOWN' | 'UP' | 'SLOW', endpointName: string): Promise<void> {
        const channels = await this.prisma.webhookChannel.findMany({
            where: { userId, isActive: true, isDeleted: false }
        })

        if (channels.length === 0) return

        const results = await Promise.allSettled(
            channels.map((channel) => this.dispatchToChannel(channel, type, endpointName, endpointId))
        )

        const succeeded = results.filter((r) => r.status === 'fulfilled').length
        const failed = results.filter((r) => r.status === 'rejected').length
        this.logger.log(`Webhook 발송 완료: userId=${userId}, 성공=${succeeded}, 실패=${failed}`)
    }

    /**
     * 단일 채널에 알림 발송 (재시도 포함)
     */
    private async dispatchToChannel(
        channel: { id: number; type: string; url: string; name: string },
        type: string,
        endpointName: string,
        endpointId: number
    ): Promise<void> {
        const decryptedUrl = this.crypto.decrypt(channel.url)
        const payload =
            channel.type === 'SLACK'
                ? WebhookPayloadBuilder.buildSlackPayload(type, endpointName)
                : WebhookPayloadBuilder.buildGenericPayload(type, endpointName, endpointId)

        let lastError: Error | null = null
        let statusCode: number | null = null
        let retryCount = 0

        for (let attempt = 0; attempt <= this.MAX_RETRY; attempt++) {
            try {
                if (attempt > 0) {
                    await this.delay(this.RETRY_DELAYS[attempt - 1])
                    retryCount = attempt
                }

                const response = await firstValueFrom(
                    this.httpService.post(decryptedUrl, payload, { timeout: 10000 })
                )
                statusCode = response.status

                await this.saveLog(channel.id, endpointId, type as AlertType, statusCode, true, retryCount, null)
                return
            } catch (error) {
                lastError = error as Error
                statusCode = (error as any)?.response?.status ?? null
                this.logger.warn(`Webhook 발송 실패 (시도 ${attempt + 1}/${this.MAX_RETRY + 1}): ${channel.name} - ${lastError.message}`)
            }
        }

        await this.saveLog(channel.id, endpointId, type as AlertType, statusCode, false, retryCount, lastError?.message ?? 'Unknown error')
    }

    /**
     * 테스트 발송 (검증 완료된 채널 객체를 직접 받아 이중 조회 방지)
     */
    async dispatchTest(
        channel: { id: number; type: string; url: string },
        userId: number
    ): Promise<{ success: boolean; statusCode: number | null; message: string }> {
        const decryptedUrl = this.crypto.decrypt(channel.url)
        const payload = WebhookPayloadBuilder.buildTestPayload(channel.type)

        try {
            const response = await firstValueFrom(this.httpService.post(decryptedUrl, payload, { timeout: 10000 }))
            await this.saveLog(channel.id, null, AlertType.TEST, response.status, true, 0, null)
            return { success: true, statusCode: response.status, message: '테스트 발송 성공' }
        } catch (error) {
            const statusCode = (error as any)?.response?.status ?? null
            const errorMessage = (error as Error).message
            await this.saveLog(channel.id, null, AlertType.TEST, statusCode, false, 0, errorMessage)
            return { success: false, statusCode, message: `테스트 발송 실패: ${errorMessage}` }
        }
    }

    /**
     * Webhook 발송 로그 저장
     */
    private async saveLog(
        channelId: number,
        endpointId: number | null,
        alertType: AlertType,
        statusCode: number | null,
        isSuccess: boolean,
        retryCount: number,
        errorMessage: string | null
    ): Promise<void> {
        try {
            await this.prisma.webhookLog.create({
                data: { channelId, endpointId, alertType, statusCode, isSuccess, retryCount, errorMessage }
            })
        } catch (error) {
            this.logger.error(`Webhook 로그 저장 실패: ${(error as Error).message}`)
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}
