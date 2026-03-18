import { NotificationType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class NotificationResponseDto {
    @ApiProperty({ required: true, description: 'ID', example: 1 })
    @Expose()
    id: number

    @ApiProperty({ required: true, description: '수신자 ID', example: 1 })
    @Expose()
    userId: number | null

    @ApiProperty({ required: true, description: '관리자 ID', example: null })
    @Expose()
    adminId: number | null

    @ApiProperty({ required: true, description: '제목', example: '시스템 점검 안내' })
    @Expose()
    title: string

    @ApiProperty({ required: true, description: '내용', example: '점검 예정입니다.' })
    @Expose()
    content: string

    @ApiProperty({ required: true, description: '알림 유형', enum: NotificationType, example: NotificationType.SYSTEM })
    @Expose()
    type: NotificationType

    @ApiProperty({ required: true, description: '생성일', example: '2023-10-27T10:00:00.000Z' })
    @Expose()
    createdAt: Date

    @ApiProperty({ required: true, description: '생성자 ID', example: 1 })
    @Expose()
    createdBy: number
}
