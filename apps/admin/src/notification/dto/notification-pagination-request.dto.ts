import { OffsetRequestDto } from '@libs/common'
import { NotificationType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'

export class NotificationPaginationRequestDto extends OffsetRequestDto {
    @ApiProperty({ required: false, description: '수신자 ID', example: 1 })
    @IsOptional()
    @IsInt()
    userId?: number

    @ApiProperty({ required: false, enum: NotificationType, description: '알림 유형', example: NotificationType.SYSTEM })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType

    @ApiProperty({ required: false, description: '검색 키워드 (제목 또는 내용)', example: 'test' })
    @IsOptional()
    @IsString()
    keyword?: string
}
