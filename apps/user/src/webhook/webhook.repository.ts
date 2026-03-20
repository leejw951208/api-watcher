import { PrismaService, WebhookChannel } from '@libs/prisma'
import { Injectable } from '@nestjs/common'

@Injectable()
export class WebhookRepository {
    constructor(private readonly prisma: PrismaService) {}

    async create(data: { userId: number; name: string; type: string; url: string }): Promise<WebhookChannel> {
        return this.prisma.webhookChannel.create({
            data: {
                userId: data.userId,
                name: data.name,
                type: data.type as any,
                url: data.url
            }
        })
    }

    async findAllByUserId(userId: number): Promise<WebhookChannel[]> {
        return this.prisma.webhookChannel.findMany({
            where: { userId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        })
    }

    async findByIdAndUserId(id: number, userId: number): Promise<WebhookChannel | null> {
        return this.prisma.webhookChannel.findFirst({
            where: { id, userId, isDeleted: false }
        })
    }

    async countByUserId(userId: number): Promise<number> {
        return this.prisma.webhookChannel.count({
            where: { userId, isDeleted: false }
        })
    }

    async update(id: number, data: Partial<{ name: string; url: string; isActive: boolean }>): Promise<WebhookChannel> {
        return this.prisma.webhookChannel.update({
            where: { id },
            data: { ...data, updatedAt: new Date() }
        })
    }

    async softDelete(id: number): Promise<WebhookChannel> {
        return this.prisma.webhookChannel.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        })
    }

    async findLogsByChannelId(channelId: number, page: number, size: number): Promise<{ items: any[]; totalCount: number }> {
        const [items, totalCount] = await Promise.all([
            this.prisma.webhookLog.findMany({
                where: { channelId },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * size,
                take: size,
                select: {
                    id: true,
                    alertType: true,
                    statusCode: true,
                    isSuccess: true,
                    retryCount: true,
                    errorMessage: true,
                    createdAt: true
                }
            }),
            this.prisma.webhookLog.count({ where: { channelId } })
        ])
        return { items, totalCount }
    }
}
