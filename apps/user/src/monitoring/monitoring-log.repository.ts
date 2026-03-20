import { MonitoringLog, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { QueryLogDto } from './dto/query-log.dto'

export type MonitoringLogOffsetResponse = {
    items: MonitoringLog[]
    totalCount: number
}

export interface UptimeStats {
    totalChecks: number
    successCount: number
    failureCount: number
    uptimePercent: number
    avgResponseTime: number
    maxResponseTime: number
    minResponseTime: number
}

@Injectable()
export class MonitoringLogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findLogsByEndpoint(endpointId: number, dto: QueryLogDto): Promise<MonitoringLogOffsetResponse> {
        const where: Prisma.MonitoringLogWhereInput = {
            endpointId,
            ...(dto.startDate && { createdAt: { gte: new Date(dto.startDate) } }),
            ...(dto.endDate && {
                createdAt: {
                    ...(dto.startDate && { gte: new Date(dto.startDate) }),
                    lte: new Date(dto.endDate)
                }
            })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.monitoringLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (dto.page - 1) * dto.size,
                take: dto.size
            }),
            this.prisma.monitoringLog.count({ where })
        ])

        return { items, totalCount }
    }

    async getUptimeStats(endpointId: number, since: Date): Promise<UptimeStats> {
        const logs = await this.prisma.monitoringLog.findMany({
            where: { endpointId, createdAt: { gte: since } },
            select: { isSuccess: true, responseTime: true }
        })

        const totalChecks = logs.length
        const successCount = logs.filter((l) => l.isSuccess).length
        const failureCount = totalChecks - successCount
        const uptimePercent = totalChecks > 0 ? Math.round((successCount / totalChecks) * 10000) / 100 : 0

        const responseTimes = logs.filter((l) => l.responseTime !== null).map((l) => l.responseTime!)
        const avgResponseTime = responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0
        const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0
        const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0

        return { totalChecks, successCount, failureCount, uptimePercent, avgResponseTime, maxResponseTime, minResponseTime }
    }

    async getDashboardByUserId(userId: number) {
        const endpoints = await this.prisma.apiEndpoint.findMany({
            where: { userId, isDeleted: false }
        })

        const totalEndpoints = endpoints.length
        const statusSummary: Record<string, number> = { UP: 0, DOWN: 0, SLOW: 0, PAUSED: 0 }
        for (const ep of endpoints) {
            statusSummary[ep.status] = (statusSummary[ep.status] || 0) + 1
        }

        const recentIncidents = endpoints
            .filter((ep) => ep.status === 'DOWN' || ep.status === 'SLOW')
            .map((ep) => ({ endpointId: ep.id, name: ep.name, status: ep.status, since: ep.lastCheckedAt }))

        return { totalEndpoints, statusSummary, recentIncidents }
    }
}
