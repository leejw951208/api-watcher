import { BaseException, CursorResponseDto, NOTIFICATION_ERROR } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { NotificationCursorRequestDto } from './dto/notification-cursor-request.dto'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationRepository } from './notification.repository'

@Injectable()
export class NotificationService {
    constructor(private readonly repository: NotificationRepository) {}

    async getMyNotifications(
        searchCondition: NotificationCursorRequestDto,
        userId: number
    ): Promise<CursorResponseDto<NotificationResponseDto>> {
        const { items, nextCursor } = await this.repository.findNotificationsCursor(searchCondition, userId)

        const notificationReads = await this.repository.findReadsByNotificationIds(
            userId,
            items.map((item) => item.id)
        )
        const notificationReadMap = new Map(notificationReads.map((item) => [item.notificationId, item.createdAt]))

        const mappedItems = items.map((item) => ({
            ...item,
            isRead: notificationReadMap.has(item.id),
            readAt: notificationReadMap.get(item.id) ?? null
        }))

        return new CursorResponseDto<NotificationResponseDto>(
            plainToInstance(NotificationResponseDto, mappedItems, { excludeExtraneousValues: true }),
            { nextCursor }
        )
    }

    async getNotification(userId: number, notificationId: number): Promise<NotificationResponseDto> {
        const notification = await this.repository.findByIdForUser(notificationId, userId)

        if (!notification) {
            throw new BaseException(NOTIFICATION_ERROR.NOT_FOUND, this.constructor.name)
        }

        const notificationRead = await this.repository.findReadByNotificationId(userId, notificationId)

        return plainToInstance(
            NotificationResponseDto,
            {
                ...notification,
                isRead: notificationRead !== null,
                readAt: notificationRead?.createdAt ?? null
            },
            { excludeExtraneousValues: true }
        )
    }

    async readNotification(userId: number, notificationId: number): Promise<void> {
        const foundNotification = await this.repository.findByIdForUser(notificationId, userId)

        if (!foundNotification) {
            throw new BaseException(NOTIFICATION_ERROR.NOT_FOUND, this.constructor.name)
        }

        const notificationRead = await this.repository.findReadByNotificationId(userId, notificationId)

        if (notificationRead) return

        await this.repository.createRead(userId, notificationId)
    }

    async readAllNotifications(userId: number): Promise<void> {
        const unreadNotificationIds = await this.repository.findUnreadNotificationIds(userId)

        if (unreadNotificationIds.length === 0) return

        await this.repository.createManyReads(userId, unreadNotificationIds)
    }

    async deleteNotification(userId: number, notificationId: number): Promise<void> {
        const notification = await this.repository.findByIdForUser(notificationId, userId)

        if (!notification) {
            throw new BaseException(NOTIFICATION_ERROR.NOT_FOUND, this.constructor.name)
        }

        await this.repository.softDelete(notificationId)
    }
}
