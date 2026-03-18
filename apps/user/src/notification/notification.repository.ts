import { Notification, NotificationRead, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { NotificationCursorRequestDto } from './dto/notification-cursor-request.dto'

export type NotificationCursorResponse = {
    items: Notification[]
    nextCursor: number | null
}

@Injectable()
export class NotificationRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findByIdForUser(id: number, userId: number): Promise<Notification | null> {
        return this.prisma.notification.findFirst({
            where: {
                id,
                isDeleted: false,
                OR: [{ userId }, { userId: null }]
            }
        })
    }

    async findReadsByNotificationIds(userId: number, notificationIds: number[]): Promise<NotificationRead[]> {
        return this.prisma.notificationRead.findMany({
            where: { userId, notificationId: { in: notificationIds } }
        })
    }

    async findReadByNotificationId(userId: number, notificationId: number): Promise<NotificationRead | null> {
        return this.prisma.notificationRead.findFirst({
            where: { userId, notificationId }
        })
    }

    async createRead(userId: number, notificationId: number): Promise<NotificationRead> {
        return this.prisma.notificationRead.create({
            data: { userId, notificationId, createdBy: this.cls.get('id') }
        })
    }

    async findUnreadNotificationIds(userId: number): Promise<number[]> {
        const notifications = await this.prisma.notification.findMany({
            where: {
                isDeleted: false,
                OR: [{ userId }, { userId: null }],
                notificationReads: { none: { userId } }
            },
            select: { id: true }
        })
        return notifications.map((n) => n.id)
    }

    async createManyReads(userId: number, notificationIds: number[]): Promise<void> {
        await this.prisma.notificationRead.createMany({
            data: notificationIds.map((notificationId) => ({
                userId,
                notificationId,
                createdBy: this.cls.get('id')
            }))
        })
    }

    async softDelete(id: number): Promise<Notification> {
        return this.prisma.notification.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: this.cls.get('id')
            }
        })
    }

    async findNotificationsCursor(searchCondition: NotificationCursorRequestDto, userId: number): Promise<NotificationCursorResponse> {
        const { lastCursor, size, order = 'desc', isRead, type } = searchCondition

        const where: Prisma.NotificationWhereInput = {
            isDeleted: false,
            OR: [{ userId }, { userId: null }],
            ...(isRead === true && { notificationReads: { some: { userId } } }),
            ...(isRead === false && { notificationReads: { none: { userId } } }),
            ...(type && { type }),
            ...(lastCursor && {
                id: order === 'asc' ? { gt: lastCursor } : { lt: lastCursor }
            })
        }

        const items = await this.prisma.notification.findMany({
            where,
            orderBy: { id: order },
            take: size + 1
        })

        const hasNext = items.length > size
        if (hasNext) items.pop()

        const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : null

        return { items, nextCursor }
    }
}
