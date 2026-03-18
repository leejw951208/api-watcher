import { OffsetResponseDto } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { CreateNotificationRequestDto } from './dto/notification-create-request.dto'
import { NotificationPaginationRequestDto } from './dto/notification-pagination-request.dto'
import { NotificationResponseDto } from './dto/notification-response.dto'
import { NotificationRepository } from './notification.repository'

@Injectable()
export class NotificationService {
    constructor(private readonly repository: NotificationRepository) {}

    async createNotification(dto: CreateNotificationRequestDto): Promise<void> {
        await this.repository.create({
            userId: dto.userId,
            title: dto.title,
            content: dto.content,
            type: dto.type
        })
    }

    async getNotifications(dto: NotificationPaginationRequestDto): Promise<OffsetResponseDto<NotificationResponseDto>> {
        const { totalCount, items } = await this.repository.findNotificationsOffset({
            pagination: { page: dto.page, size: dto.size, order: dto.order },
            searchCondition: {
                userId: dto.userId,
                type: dto.type,
                keyword: dto.keyword
            }
        })

        return new OffsetResponseDto(
            plainToInstance(NotificationResponseDto, items, { excludeExtraneousValues: true }),
            { page: dto.page, totalCount }
        )
    }
}
