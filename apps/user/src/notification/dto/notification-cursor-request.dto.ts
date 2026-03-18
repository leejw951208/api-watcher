import { CursorRequestDto } from '@libs/common'
import { NotificationType } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsOptional } from 'class-validator'

export class NotificationCursorRequestDto extends CursorRequestDto {
    @ApiProperty({ type: Boolean, required: false, description: '읽음 여부 필터', example: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isRead?: boolean

    @ApiProperty({
        enum: NotificationType,
        required: false,
        description: '알림 타입 필터',
        example: NotificationType.SYSTEM
    })
    @IsOptional()
    @IsEnum(NotificationType)
    type?: NotificationType
}
