import { PostStatus } from '@libs/prisma'
import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class AdminPostResponseDto {
    @ApiProperty({ type: Number })
    @Expose()
    id: number

    @ApiProperty({ type: String })
    @Expose()
    title: string

    @ApiProperty({ type: String })
    @Expose()
    content: string

    @ApiProperty({ type: Number })
    @Expose()
    userId: number

    @ApiProperty({ type: Number })
    @Expose()
    viewCount: number

    @ApiProperty({ enum: PostStatus })
    @Expose()
    status: PostStatus

    @ApiProperty({ type: Date })
    @Expose()
    createdAt: Date

    @ApiProperty({ type: Date, required: false })
    @Expose()
    updatedAt: Date | null
}
