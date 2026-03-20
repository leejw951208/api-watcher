import { ApiEndpoint, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { AdminEndpointPaginationRequestDto } from './dto/admin-endpoint-pagination-request.dto'

export type AdminEndpointOffsetResponse = {
    items: (ApiEndpoint & { user: { id: number; email: string; name: string } })[]
    totalCount: number
}

@Injectable()
export class AdminEndpointRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findById(id: number): Promise<ApiEndpoint | null> {
        return this.prisma.apiEndpoint.findFirst({
            where: { id, isDeleted: false }
        })
    }

    async findEndpointsOffset(dto: AdminEndpointPaginationRequestDto): Promise<AdminEndpointOffsetResponse> {
        const where: Prisma.ApiEndpointWhereInput = {
            isDeleted: false,
            ...(dto.name && { name: { contains: dto.name } }),
            ...(dto.status && { status: dto.status }),
            ...(dto.userId && { userId: dto.userId })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.apiEndpoint.findMany({
                where,
                include: { user: { select: { id: true, email: true, name: true } } },
                orderBy: { id: dto.order ?? 'desc' },
                skip: (dto.page - 1) * dto.size,
                take: dto.size
            }),
            this.prisma.apiEndpoint.count({ where })
        ])

        return { items, totalCount }
    }

    async update(id: number, data: Prisma.ApiEndpointUpdateInput): Promise<ApiEndpoint> {
        return this.prisma.apiEndpoint.update({
            where: { id },
            data: { ...data, updatedAt: new Date(), updatedBy: this.cls.get('id') }
        })
    }

    async softDelete(id: number): Promise<ApiEndpoint> {
        return this.prisma.apiEndpoint.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date(), deletedBy: this.cls.get('id') }
        })
    }
}
