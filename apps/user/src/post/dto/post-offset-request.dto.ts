import { OffsetRequestDto } from '@libs/common'
import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class PostOffsetRequestDto extends OffsetRequestDto {
    @ApiProperty({ type: String, required: false, description: '게시글 제목 검색', example: '공지사항' })
    @IsOptional()
    @IsString()
    title?: string

    @ApiProperty({ type: String, required: false, enum: PostStatus, description: '게시글 상태', example: 'PUBLISHED' })
    @IsOptional()
    @IsEnum(PostStatus)
    status?: PostStatus
}
