import { BaseException, CreateResponseDto, MONITORING_ERROR, OffsetResponseDto } from '@libs/common'
import { EndpointStatus, Prisma } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { CreateEndpointDto } from './dto/create-endpoint.dto'
import { EndpointPaginationRequestDto } from './dto/endpoint-pagination-request.dto'
import { EndpointResponseDto } from './dto/endpoint-response.dto'
import { UpdateEndpointDto } from './dto/update-endpoint.dto'
import { EndpointRepository } from './endpoint.repository'

const MAX_ENDPOINTS_PER_USER = 10

@Injectable()
export class EndpointService {
    constructor(private readonly repository: EndpointRepository) {}

    async createEndpoint(userId: number, dto: CreateEndpointDto): Promise<CreateResponseDto> {
        // 등록 제한 체크
        const count = await this.repository.countByUserId(userId)
        if (count >= MAX_ENDPOINTS_PER_USER) {
            throw new BaseException(MONITORING_ERROR.ENDPOINT_LIMIT_EXCEEDED, this.constructor.name)
        }

        // URL 중복 체크 (같은 사용자 내)
        const existing = await this.repository.findByUrlAndUserId(dto.url, userId)
        if (existing) throw new BaseException(MONITORING_ERROR.DUPLICATE_URL, this.constructor.name)

        const endpoint = await this.repository.create({
            userId,
            name: dto.name,
            url: dto.url,
            method: dto.method,
            headers: (dto.headers as Prisma.InputJsonValue) ?? undefined,
            body: (dto.body as Prisma.InputJsonValue) ?? undefined,
            expectedStatus: dto.expectedStatus,
            timeout: dto.timeout,
            interval: dto.interval,
            failureThreshold: dto.failureThreshold
        })

        return new CreateResponseDto(endpoint.id)
    }

    async getEndpoint(userId: number, endpointId: number): Promise<EndpointResponseDto> {
        const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        return plainToInstance(EndpointResponseDto, endpoint, { excludeExtraneousValues: true })
    }

    async getEndpoints(userId: number, dto: EndpointPaginationRequestDto): Promise<OffsetResponseDto<EndpointResponseDto>> {
        const { items, totalCount } = await this.repository.findEndpointsOffset(userId, dto)
        return new OffsetResponseDto(plainToInstance(EndpointResponseDto, items, { excludeExtraneousValues: true }), {
            page: dto.page,
            totalCount
        })
    }

    async updateEndpoint(userId: number, endpointId: number, dto: UpdateEndpointDto): Promise<void> {
        const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)

        if (dto.url && dto.url !== endpoint.url) {
            const existing = await this.repository.findByUrlAndUserId(dto.url, userId)
            if (existing) throw new BaseException(MONITORING_ERROR.DUPLICATE_URL, this.constructor.name)
        }

        const { headers, body, ...rest } = dto
        const updateData: Prisma.ApiEndpointUpdateInput = {
            ...rest,
            ...(headers !== undefined && { headers: headers as Prisma.InputJsonValue }),
            ...(body !== undefined && { body: body as Prisma.InputJsonValue })
        }
        await this.repository.update(endpointId, updateData)
    }

    async deleteEndpoint(userId: number, endpointId: number): Promise<void> {
        const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.softDelete(endpointId)
    }

    async pauseEndpoint(userId: number, endpointId: number): Promise<void> {
        const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.update(endpointId, { isPaused: true, status: EndpointStatus.PAUSED })
    }

    async resumeEndpoint(userId: number, endpointId: number): Promise<void> {
        const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.update(endpointId, { isPaused: false, status: EndpointStatus.UP, consecutiveFailures: 0 })
    }
}
