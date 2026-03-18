import { Post, PostStatus, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { AdminPostPaginationRequestDto } from './dto/admin-post-pagination-request.dto'

export type AdminPostOffsetResponse = {
    items: Post[]
    totalCount: number
}

@Injectable()
export class AdminPostRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findById(id: number): Promise<Post | null> {
        return this.prisma.post.findFirst({
            where: { id, isDeleted: false }
        })
    }

    async findPostsOffset(dto: AdminPostPaginationRequestDto): Promise<AdminPostOffsetResponse> {
        const where: Prisma.PostWhereInput = {
            isDeleted: false,
            ...(dto.title && { title: { contains: dto.title } }),
            ...(dto.userId && { userId: dto.userId }),
            ...(dto.status && { status: dto.status })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.post.findMany({
                where,
                orderBy: { id: dto.order ?? 'desc' },
                skip: (dto.page - 1) * dto.size,
                take: dto.size
            }),
            this.prisma.post.count({ where })
        ])

        return { items, totalCount }
    }

    async updateStatus(id: number, status: PostStatus): Promise<Post> {
        return this.prisma.post.update({
            where: { id },
            data: { status, updatedAt: new Date(), updatedBy: this.cls.get('id') }
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
}
