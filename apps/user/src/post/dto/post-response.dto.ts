import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class PostResponseDto {
    @ApiProperty({ required: true, description: '게시글 ID', example: 1 })
    @Expose()
    id: number

    @ApiProperty({ required: true, description: '게시글 제목', example: '첫 번째 게시글' })
    @Expose()
    title: string

    @ApiProperty({ required: true, description: '게시글 내용', example: '게시글 내용입니다.' })
    @Expose()
    content: string

    @ApiProperty({ required: true, description: '조회수', example: 0 })
    @Expose()
    viewCount: number

    @ApiProperty({ required: true, description: '게시글 상태', example: 'PUBLISHED', enum: PostStatus })
    @Expose()
    status: PostStatus

    @ApiProperty({ required: true, description: '생성일', example: '2021-01-01' })
    @Expose()
    createdAt: Date

    @ApiProperty({ required: false, description: '수정일', example: '2021-01-01' })
    @Expose()
    updatedAt: Date | null
}
