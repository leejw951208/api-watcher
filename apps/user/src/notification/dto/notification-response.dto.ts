import { NotificationType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class NotificationResponseDto {
    @ApiProperty({ required: true, description: '알림 ID', example: 1 })
    @Expose()
    id: number

    @ApiProperty({ required: true, description: '알림 제목', example: '새 알림' })
    @Expose()
    title: string

    @ApiProperty({ required: true, description: '알림 내용', example: '새로운 알림이 도착했습니다.' })
    @Expose()
    content: string

    @ApiProperty({ required: true, enum: NotificationType, description: '알림 타입', example: NotificationType.SYSTEM })
    @Expose()
    type: NotificationType

    @ApiProperty({ required: true, type: Boolean, description: '읽음 여부', example: false })
    @Expose()
    isRead: boolean

    @ApiProperty({ required: true, type: Date, description: '읽은 시간', example: null })
    @Expose()
    readAt: Date | null

    @ApiProperty({ required: true, type: Date, description: '생성 시간', example: '2025-12-07T00:00:00.000Z' })
    @Expose()
    createdAt: Date
}
