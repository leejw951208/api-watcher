import { MonitoringLog, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'

export type AdminLogOffsetResponse = {
    items: MonitoringLog[]
    totalCount: number
}

@Injectable()
export class AdminMonitoringLogRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findLogsOffset(page: number, size: number, endpointId?: number): Promise<AdminLogOffsetResponse> {
        const where: Prisma.MonitoringLogWhereInput = {
            ...(endpointId && { endpointId })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.monitoringLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * size,
                take: size
            }),
            this.prisma.monitoringLog.count({ where })
        ])

        return { items, totalCount }
    }

    async getSystemDashboard() {
        const endpoints = await this.prisma.apiEndpoint.findMany({
            where: { isDeleted: false }
        })

        const totalEndpoints = endpoints.length
        const totalUsers = new Set(endpoints.map((ep) => ep.userId)).size
        const statusSummary: Record<string, number> = { UP: 0, DOWN: 0, SLOW: 0, PAUSED: 0 }
        for (const ep of endpoints) {
            statusSummary[ep.status] = (statusSummary[ep.status] || 0) + 1
        }

        const recentIncidents = endpoints
            .filter((ep) => ep.status === 'DOWN' || ep.status === 'SLOW')
            .map((ep) => ({ endpointId: ep.id, userId: ep.userId, name: ep.name, status: ep.status, since: ep.lastCheckedAt }))

        return { totalEndpoints, totalUsers, statusSummary, recentIncidents }
    }
}
