import { OffsetRequestDto, OffsetResponseDto } from '@libs/common'
import { Injectable } from '@nestjs/common'
import { AdminWebhookRepository } from './webhook.repository'

@Injectable()
export class AdminWebhookService {
    constructor(private readonly webhookRepository: AdminWebhookRepository) {}

    async findAll(query: OffsetRequestDto): Promise<OffsetResponseDto<any>> {
        const { items, totalCount } = await this.webhookRepository.findAll(query.page, query.size)
        return new OffsetResponseDto(items, { page: query.page, totalCount })
    }

    async findLogsByChannelId(channelId: number, query: OffsetRequestDto): Promise<OffsetResponseDto<any>> {
        const { items, totalCount } = await this.webhookRepository.findLogsByChannelId(channelId, query.page, query.size)
        return new OffsetResponseDto(items, { page: query.page, totalCount })
    }
}
