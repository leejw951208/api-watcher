import { OffsetRequestDto } from '@libs/common'
import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'

export class AdminPostPaginationRequestDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '제목 검색' })
    @IsOptional()
    @IsString()
    title?: string

    @ApiProperty({ type: Number, required: false, description: '작성자 ID' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    userId?: number

    @ApiProperty({ enum: PostStatus, required: false, description: '게시글 상태' })
    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus
}
