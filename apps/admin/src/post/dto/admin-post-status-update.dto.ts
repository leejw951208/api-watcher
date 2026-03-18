import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class AdminPostStatusUpdateDto {
    @ApiProperty({ enum: PostStatus, description: '변경할 상태' })
    @IsEnum(PostStatus)
    status: PostStatus
}
