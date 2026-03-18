import { Post, PostStatus, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { PostCursorRequestDto } from './dto/post-cursor-request.dto'
import { PostOffsetRequestDto } from './dto/post-offset-request.dto'

export type PostOffsetResponse = {
    items: Post[]
    totalCount: number
}

export type PostCursorResponse = {
    items: Post[]
    nextCursor: number | null
}

export type CreatePostData = {
    userId: number
    title: string
    content: string
    status: PostStatus
}

export type UpdatePostData = {
    title?: string
    content?: string
    status?: PostStatus
}

@Injectable()
export class PostRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findByIdAndUserId(id: number, userId: number): Promise<Post | null> {
        return this.prisma.post.findFirst({
            where: { id, userId, isDeleted: false }
        })
    }

    async create(data: CreatePostData): Promise<Post> {
        return this.prisma.post.create({
            data: { ...data, createdBy: this.cls.get('id') }
        })
    }

    async update(id: number, data: UpdatePostData): Promise<Post> {
        return this.prisma.post.update({
            where: { id },
            data: { ...data, updatedAt: new Date(), updatedBy: this.cls.get('id') }
        })
    }

    async incrementViewCount(id: number): Promise<void> {
        await this.prisma.post.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        })
    }

    async softDelete(id: number): Promise<Post> {
        return this.prisma.post.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: this.cls.get('id')
            }
        })
    }

    async findPostsOffset(searchCondition: PostOffsetRequestDto, userId?: number): Promise<PostOffsetResponse> {
        const where: Prisma.PostWhereInput = {
            isDeleted: false,
            ...(userId && { userId }),
            ...(searchCondition.title && { title: { contains: searchCondition.title } }),
            ...(searchCondition.status && { status: searchCondition.status })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.post.findMany({
                where,
                orderBy: { id: searchCondition.order },
                skip: (searchCondition.page - 1) * searchCondition.size,
                take: searchCondition.size
            }),
            this.prisma.post.count({ where })
        ])

        return { items, totalCount }
    }

    async findPostsCursor(searchCondition: PostCursorRequestDto, userId?: number): Promise<PostCursorResponse> {
        const where: Prisma.PostWhereInput = {
            isDeleted: false,
            ...(userId && { userId }),
            ...(searchCondition.title && { title: { contains: searchCondition.title } }),
            ...(searchCondition.lastCursor && {
                id: searchCondition.order === 'asc' ? { gt: searchCondition.lastCursor } : { lt: searchCondition.lastCursor }
            })
        }

        const items = await this.prisma.post.findMany({
            where,
            orderBy: { id: searchCondition.order },
            take: searchCondition.size + 1
        })

        const hasNext = items.length > searchCondition.size
        if (hasNext) items.pop()

        const nextCursor = hasNext && items.length > 0 ? items[items.length - 1].id : null

        return { items, nextCursor }
    }
}
