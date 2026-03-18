import { BaseException, CreateResponseDto, CursorResponseDto, OffsetResponseDto, POST_ERROR } from '@libs/common'
import { PostStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { PostCreateDto } from './dto/post-create.dto'
import { PostCursorRequestDto } from './dto/post-cursor-request.dto'
import { PostOffsetRequestDto } from './dto/post-offset-request.dto'
import { PostResponseDto } from './dto/post-response.dto'
import { PostUpdateDto } from './dto/post-update.dto'
import { PostRepository } from './post.repository'

@Injectable()
export class PostService {
    constructor(private readonly repository: PostRepository) {}

    async savePost(userId: number, reqDto: PostCreateDto): Promise<CreateResponseDto> {
        const savedPost = await this.repository.create({
            userId,
            title: reqDto.title,
            content: reqDto.content,
            status: reqDto.status ?? PostStatus.PUBLISHED
        })
        return new CreateResponseDto(savedPost.id)
    }

    async getPost(userId: number, postId: number): Promise<PostResponseDto> {
        const foundPost = await this.repository.findByIdAndUserId(postId, userId)

        if (!foundPost) {
            throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        }

        await this.repository.incrementViewCount(foundPost.id)

        return plainToInstance(PostResponseDto, { ...foundPost, viewCount: foundPost.viewCount + 1 }, { excludeExtraneousValues: true })
    }

    async updatePost(userId: number, postId: number, reqDto: PostUpdateDto): Promise<void> {
        const foundPost = await this.repository.findByIdAndUserId(postId, userId)

        if (!foundPost) {
            throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        }

        await this.repository.update(foundPost.id, reqDto)
    }

    async deletePost(userId: number, postId: number): Promise<void> {
        const foundPost = await this.repository.findByIdAndUserId(postId, userId)

        if (!foundPost) {
            throw new BaseException(POST_ERROR.NOT_FOUND, this.constructor.name)
        }

        await this.repository.softDelete(foundPost.id)
    }

    async getPostsOffset(searchCondition: PostOffsetRequestDto, userId?: number): Promise<OffsetResponseDto<PostResponseDto>> {
        const { items, totalCount } = await this.repository.findPostsOffset(searchCondition, userId)
        return new OffsetResponseDto<PostResponseDto>(plainToInstance(PostResponseDto, items, { excludeExtraneousValues: true }), {
            page: searchCondition.page,
            totalCount
        })
    }

    async getPostsCursor(searchCondition: PostCursorRequestDto, userId?: number): Promise<CursorResponseDto<PostResponseDto>> {
        const { items, nextCursor } = await this.repository.findPostsCursor(searchCondition, userId)
        return new CursorResponseDto<PostResponseDto>(plainToInstance(PostResponseDto, items, { excludeExtraneousValues: true }), {
            nextCursor
        })
    }
}
