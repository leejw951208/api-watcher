import { Prisma, PrismaService, User, UserStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { AdminUserPaginationRequestDto } from './dto/admin-user-pagination-request.dto'

export type AdminUserOffsetResponse = {
    items: User[]
    totalCount: number
}

@Injectable()
export class AdminUserRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findById(id: number): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { id, isDeleted: false }
        })
    }

    async findUsersOffset(dto: AdminUserPaginationRequestDto): Promise<AdminUserOffsetResponse> {
        const where: Prisma.UserWhereInput = {
            isDeleted: false,
            ...(dto.name && { name: { contains: dto.name } }),
            ...(dto.email && { email: { contains: dto.email } }),
            ...(dto.status && { status: dto.status })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.user.findMany({
                where,
                orderBy: { id: dto.order ?? 'desc' },
                skip: (dto.page - 1) * dto.size,
                take: dto.size
            }),
            this.prisma.user.count({ where })
        ])

        return { items, totalCount }
    }

    async updateStatus(id: number, status: UserStatus): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { status, updatedAt: new Date(), updatedBy: this.cls.get('id') }
        })
    }

    async softDelete(id: number): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: {
                status: UserStatus.WITHDRAWN,
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: this.cls.get('id')
            }
        })
    }
}
