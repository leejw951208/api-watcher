import { ApiEndpoint, Prisma, PrismaService } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { ClsService } from 'nestjs-cls'
import { EndpointPaginationRequestDto } from './dto/endpoint-pagination-request.dto'

export type EndpointOffsetResponse = {
    items: ApiEndpoint[]
    totalCount: number
}

export type CreateEndpointData = {
    userId: number
    name: string
    url: string
    method?: string
    headers?: Prisma.InputJsonValue
    body?: Prisma.InputJsonValue
    expectedStatus?: number
    timeout?: number
    interval?: string
    failureThreshold?: number
}

@Injectable()
export class EndpointRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cls: ClsService
    ) {}

    async findByIdAndUserId(id: number, userId: number): Promise<ApiEndpoint | null> {
        return this.prisma.apiEndpoint.findFirst({
            where: { id, userId, isDeleted: false }
        })
    }

    async findByUrlAndUserId(url: string, userId: number): Promise<ApiEndpoint | null> {
        return this.prisma.apiEndpoint.findFirst({
            where: { url, userId, isDeleted: false }
        })
    }

    async countByUserId(userId: number): Promise<number> {
        return this.prisma.apiEndpoint.count({
            where: { userId, isDeleted: false }
        })
    }

    async create(data: CreateEndpointData): Promise<ApiEndpoint> {
        return this.prisma.apiEndpoint.create({
            data: { ...data, createdBy: this.cls.get('id') } as Prisma.ApiEndpointUncheckedCreateInput
        })
    }

    async findEndpointsOffset(userId: number, dto: EndpointPaginationRequestDto): Promise<EndpointOffsetResponse> {
        const where: Prisma.ApiEndpointWhereInput = {
            userId,
            isDeleted: false,
            ...(dto.name && { name: { contains: dto.name } }),
            ...(dto.status && { status: dto.status })
        }

        const [items, totalCount] = await Promise.all([
            this.prisma.apiEndpoint.findMany({
                where,
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
