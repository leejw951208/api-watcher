import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class NotificationUpdateDto {
    @ApiPropertyOptional({ description: '읽음 여부', example: true })
    @IsOptional()
    @IsBoolean()
    isRead?: boolean
}
