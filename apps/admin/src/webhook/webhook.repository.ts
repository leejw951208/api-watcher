import { PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AdminWebhookRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(page: number, size: number) {
        const [items, totalCount] = await Promise.all([
            this.prisma.webhookChannel.findMany({
                where: { isDeleted: false },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    isActive: true,
                    createdAt: true,
                    user: { select: { id: true, email: true, name: true } },
                    _count: { select: { webhookLogs: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * size,
                take: size
            }),
            this.prisma.webhookChannel.count({ where: { isDeleted: false } })
        ])
        return { items, totalCount }
    }

    async findLogsByChannelId(channelId: number, page: number, size: number) {
        const [items, totalCount] = await Promise.all([
            this.prisma.webhookLog.findMany({
                where: { channelId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * size,
                take: size
            }),
            this.prisma.webhookLog.count({ where: { channelId } })
        ])
        return { items, totalCount }
    }
}
