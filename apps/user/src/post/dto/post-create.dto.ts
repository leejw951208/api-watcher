import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class PostCreateDto {
    @ApiProperty({ required: true, description: '게시글 제목', example: '첫 번째 게시글' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string

    @ApiProperty({ required: true, description: '게시글 내용', example: '게시글 내용입니다.' })
    @IsString()
    @IsNotEmpty()
    content: string

    @ApiProperty({ required: false, description: '게시글 상태', example: 'PUBLISHED', enum: PostStatus, default: 'PUBLISHED' })
    @IsEnum(PostStatus)
    @IsOptional()
    status?: PostStatus = PostStatus.PUBLISHED
}
