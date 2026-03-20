import { CheckInterval, EndpointStatus, PrismaService } from '@libs/prisma'
import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { HealthCheckerService } from './health-checker.service'
import { MonitoringAlertService } from './monitoring-alert.service'

const SLOW_THRESHOLD_MS = 5000

const INTERVAL_MS: Record<CheckInterval, number> = {
    SEC_30: 30_000,
    MIN_1: 60_000,
    MIN_3: 180_000,
    MIN_5: 300_000
}

const MAX_CONCURRENT = 10

@Injectable()
export class MonitoringSchedulerService {
    private readonly logger = new Logger(MonitoringSchedulerService.name)

    constructor(
        private readonly prisma: PrismaService,
        private readonly healthChecker: HealthCheckerService,
        private readonly alertService: MonitoringAlertService
    ) {}

    @Cron(CronExpression.EVERY_30_SECONDS)
    async handleCron(): Promise<void> {
        const now = new Date()

        const endpoints = await this.prisma.apiEndpoint.findMany({
            where: { isPaused: false, isDeleted: false }
        })

        const targets = endpoints.filter((ep) => {
            if (!ep.lastCheckedAt) return true
            const elapsed = now.getTime() - ep.lastCheckedAt.getTime()
            return elapsed >= INTERVAL_MS[ep.interval]
        })

        if (targets.length === 0) return

        this.logger.debug(`헬스체크 대상: ${targets.length}개`)

        for (let i = 0; i < targets.length; i += MAX_CONCURRENT) {
            const chunk = targets.slice(i, i + MAX_CONCURRENT)
            const results = await Promise.allSettled(chunk.map((ep) => this.healthChecker.check(ep)))

            for (let j = 0; j < chunk.length; j++) {
                const endpoint = chunk[j]
                const result = results[j]

                if (result.status === 'rejected') {
                    this.logger.error(`헬스체크 예외 [${endpoint.name}]: ${result.reason}`)
                    continue
                }

                await this.processResult(
                    endpoint.id,
                    endpoint.userId,
                    endpoint.name,
                    endpoint.status,
                    endpoint.failureThreshold,
                    endpoint.consecutiveFailures,
                    result.value
                )
            }
        }
    }

    private async processResult(
        endpointId: number,
        userId: number,
        endpointName: string,
        previousStatus: EndpointStatus,
        failureThreshold: number,
        currentFailures: number,
        result: { statusCode: number | null; responseTime: number | null; isSuccess: boolean; errorMessage: string | null }
    ): Promise<void> {
        // 로그 저장
        await this.prisma.monitoringLog.create({
            data: {
                endpointId,
                statusCode: result.statusCode,
                responseTime: result.responseTime,
                isSuccess: result.isSuccess,
                errorMessage: result.errorMessage
            }
        })

        if (result.isSuccess) {
            const newStatus: EndpointStatus =
                result.responseTime && result.responseTime > SLOW_THRESHOLD_MS ? EndpointStatus.SLOW : EndpointStatus.UP

            await this.prisma.apiEndpoint.update({
                where: { id: endpointId },
                data: { consecutiveFailures: 0, status: newStatus, lastCheckedAt: new Date() }
            })

            if ((previousStatus === EndpointStatus.DOWN || previousStatus === EndpointStatus.SLOW) && newStatus === EndpointStatus.UP) {
                await this.alertService.sendAlert(endpointId, userId, 'UP', endpointName)
            }

            if (newStatus === EndpointStatus.SLOW && previousStatus !== EndpointStatus.SLOW) {
                await this.alertService.sendAlert(endpointId, userId, 'SLOW', endpointName)
            }
        } else {
            const newFailures = currentFailures + 1
            const newStatus: EndpointStatus = newFailures >= failureThreshold ? EndpointStatus.DOWN : previousStatus

            await this.prisma.apiEndpoint.update({
                where: { id: endpointId },
                data: { consecutiveFailures: newFailures, status: newStatus, lastCheckedAt: new Date() }
            })

            if (newStatus === EndpointStatus.DOWN && previousStatus !== EndpointStatus.DOWN) {
                await this.alertService.sendAlert(endpointId, userId, 'DOWN', endpointName)
            }
        }
    }
}
