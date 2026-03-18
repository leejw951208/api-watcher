import { UserStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class AdminUserStatusUpdateDto {
    @ApiProperty({ enum: UserStatus, description: '변경할 상태' })
    @IsEnum(UserStatus)
    status: UserStatus
}
