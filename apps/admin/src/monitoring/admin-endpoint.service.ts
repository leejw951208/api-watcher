import { BaseException, MONITORING_ERROR, OffsetResponseDto } from '@libs/common'
import { EndpointStatus } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { AdminEndpointPaginationRequestDto } from './dto/admin-endpoint-pagination-request.dto'
import { AdminEndpointResponseDto } from './dto/admin-endpoint-response.dto'
import { AdminEndpointRepository } from './admin-endpoint.repository'

@Injectable()
export class AdminEndpointService {
    constructor(private readonly repository: AdminEndpointRepository) {}

    async getEndpoints(dto: AdminEndpointPaginationRequestDto): Promise<OffsetResponseDto<AdminEndpointResponseDto>> {
        const { items, totalCount } = await this.repository.findEndpointsOffset(dto)
        return new OffsetResponseDto(plainToInstance(AdminEndpointResponseDto, items, { excludeExtraneousValues: true }), {
            page: dto.page,
            totalCount
        })
    }

    async getEndpoint(id: number): Promise<AdminEndpointResponseDto> {
        const endpoint = await this.repository.findById(id)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        return plainToInstance(AdminEndpointResponseDto, endpoint, { excludeExtraneousValues: true })
    }

    async pauseEndpoint(id: number): Promise<void> {
        const endpoint = await this.repository.findById(id)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.update(id, { isPaused: true, status: EndpointStatus.PAUSED })
    }

    async deleteEndpoint(id: number): Promise<void> {
        const endpoint = await this.repository.findById(id)
        if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, this.constructor.name)
        await this.repository.softDelete(id)
    }
}
