import { BaseException, OffsetResponseDto, POST_ERROR } from '@libs/common'
import { PostStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { AdminPostPaginationRequestDto } from './dto/admin-post-pagination-request.dto'
import { AdminPostResponseDto } from './dto/admin-post-response.dto'
import { AdminPostRepository } from './post.repository'

@Injectable()
export class AdminPostService {
    constructor(private readonly repository: AdminPostRepository) {}

    async getPost(postId: number): Promise<AdminPostResponseDto> {
        const foundPost = await this.repository.findById(postId)
        if (!foundPost) throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        return plainToInstance(AdminPostResponseDto, foundPost, { excludeExtraneousValues: true })
    }

    async getPosts(dto: AdminPostPaginationRequestDto): Promise<OffsetResponseDto<AdminPostResponseDto>> {
        const { items, totalCount } = await this.repository.findPostsOffset(dto)
        return new OffsetResponseDto(
            plainToInstance(AdminPostResponseDto, items, { excludeExtraneousValues: true }),
            { page: dto.page, totalCount }
        )
    }

    async updatePostStatus(postId: number, status: PostStatus): Promise<void> {
        const foundPost = await this.repository.findById(postId)
        if (!foundPost) throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.updateStatus(postId, status)
    }

    async deletePost(postId: number): Promise<void> {
        const foundPost = await this.repository.findById(postId)
        if (!foundPost) throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.softDelete(postId)
    }
}
