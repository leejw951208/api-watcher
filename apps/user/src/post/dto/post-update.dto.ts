import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class PostUpdateDto {
    @ApiProperty({ required: false, description: '게시글 제목', example: '수정된 게시글 제목' })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    title?: string

    @ApiProperty({ required: false, description: '게시글 내용', example: '수정된 게시글 내용입니다.' })
    @IsString()
    @IsOptional()
    content?: string

    @ApiProperty({ required: false, description: '게시글 상태', example: 'PUBLISHED', enum: PostStatus })
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus
}
