import { Notification, NotificationType, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'

export type CreateNotificationData = {
    userId?: number
    title: string
    content: string
    type: NotificationType
}

export type NotificationsOffsetParams = {
    pagination: {
        page: number
        size: number
        order?: 'asc' | 'desc'
    }
    searchCondition: {
        userId?: number
        type?: NotificationType
        keyword?: string
    }
}

export type NotificationsOffsetResponse = {
    items: Notification[]
    totalCount: number
}

@Injectable()
export class NotificationRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async create(data: CreateNotificationData): Promise<Notification> {
        return this.prisma.notification.create({
            data: {
                title: data.title,
                content: data.content,
                type: data.type,
                createdBy: this.cls.get('id'),
                ...(data.userId && { user: { connect: { id: data.userId } } })
            }
        })
    }

    async findNotificationsOffset(params: NotificationsOffsetParams): Promise<NotificationsOffsetResponse> {
        const { pagination, searchCondition } = params

        const where: Prisma.NotificationWhereInput = {
            isDeleted: false,
            ...(searchCondition.userId && { userId: searchCondition.userId }),
            ...(searchCondition.type && { type: searchCondition.type }),
            ...(searchCondition.keyword && {
                OR: [{ title: { contains: searchCondition.keyword } }, { content: { contains: searchCondition.keyword } }]
            })
        }

        const [totalCount, items] = await Promise.all([
            this.prisma.notification.count({ where }),
            this.prisma.notification.findMany({
                where,
                skip: (pagination.page - 1) * pagination.size,
                take: pagination.size,
                orderBy: { id: pagination.order ?? 'desc' }
            })
        ])

        return { totalCount, items }
    }
}
