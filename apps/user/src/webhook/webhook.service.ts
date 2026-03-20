import { BaseException, CryptoService, OffsetRequestDto, OffsetResponseDto, WEBHOOK_ERROR, WebhookDispatchService } from '@libs/common'
import { WebhookChannel } from '@libs/prisma'
import { Injectable } from '@nestjs/common'
import { CreateWebhookChannelDto } from './dto/create-webhook-channel.dto'
import { UpdateWebhookChannelDto } from './dto/update-webhook-channel.dto'
import { WebhookChannelResponseDto } from './dto/webhook-channel-response.dto'
import { WebhookTestResponseDto } from './dto/webhook-log-response.dto'
import { WebhookRepository } from './webhook.repository'

const MAX_CHANNELS_PER_USER = 5

@Injectable()
export class WebhookService {
    constructor(
        private readonly webhookRepository: WebhookRepository,
        private readonly cryptoService: CryptoService,
        private readonly webhookDispatchService: WebhookDispatchService
    ) {}

    /**
     * Webhook 채널 생성
     */
    async create(userId: number, dto: CreateWebhookChannelDto): Promise<WebhookChannelResponseDto> {
        // Slack URL 검증
        if (dto.type === 'SLACK' && !dto.url.startsWith('https://hooks.slack.com/')) {
            throw new BaseException(WEBHOOK_ERROR.INVALID_URL, 'WebhookService.create')
        }

        // 채널 수 제한 검사
        const count = await this.webhookRepository.countByUserId(userId)
        if (count >= MAX_CHANNELS_PER_USER) {
            throw new BaseException(WEBHOOK_ERROR.CHANNEL_LIMIT_EXCEEDED, 'WebhookService.create')
        }

        // 중복 URL 검사 (AES-256은 IV가 매번 달라 암호문 비교 불가 → 복호화 비교)
        await this.checkDuplicateUrl(dto.url, userId)

        const channel = await this.webhookRepository.create({
            userId,
            name: dto.name,
            type: dto.type,
            url: this.cryptoService.encrypt(dto.url)
        })

        return this.toResponse(channel)
    }

    /**
     * 내 채널 목록 조회
     */
    async findAll(userId: number): Promise<WebhookChannelResponseDto[]> {
        const channels = await this.webhookRepository.findAllByUserId(userId)
        return channels.map((ch) => this.toResponse(ch))
    }

    /**
     * 채널 상세 조회
     */
    async findOne(id: number, userId: number): Promise<WebhookChannelResponseDto> {
        const channel = await this.findOwnChannel(id, userId)
        return this.toResponse(channel)
    }

    /**
     * 채널 수정
     */
    async update(id: number, userId: number, dto: UpdateWebhookChannelDto): Promise<WebhookChannelResponseDto> {
        await this.findOwnChannel(id, userId)

        const updateData: Partial<{ name: string; url: string; isActive: boolean }> = {}
        if (dto.name !== undefined) updateData.name = dto.name
        if (dto.isActive !== undefined) updateData.isActive = dto.isActive
        if (dto.url !== undefined) {
            // URL 변경 시 중복 검사 (자기 자신 제외)
            await this.checkDuplicateUrl(dto.url, userId, id)
            updateData.url = this.cryptoService.encrypt(dto.url)
        }

        const updated = await this.webhookRepository.update(id, updateData)
        return this.toResponse(updated)
    }

    /**
     * 채널 삭제 (soft delete)
     */
    async remove(id: number, userId: number): Promise<void> {
        await this.findOwnChannel(id, userId)
        await this.webhookRepository.softDelete(id)
    }

    /**
     * 테스트 발송
     */
    async testDispatch(id: number, userId: number): Promise<WebhookTestResponseDto> {
        const channel = await this.findOwnChannel(id, userId)
        return this.webhookDispatchService.dispatchTest(channel, userId)
    }

    /**
     * 발송 이력 조회
     */
    async findLogs(id: number, userId: number, query: OffsetRequestDto): Promise<OffsetResponseDto<any>> {
        await this.findOwnChannel(id, userId)
        const { items, totalCount } = await this.webhookRepository.findLogsByChannelId(id, query.page, query.size)
        return new OffsetResponseDto(items, { page: query.page, totalCount })
    }

    /**
     * 중복 URL 검사 (AES-256 IV 특성상 복호화 비교 필수)
     */
    private async checkDuplicateUrl(url: string, userId: number, excludeId?: number): Promise<void> {
        const existingChannels = await this.webhookRepository.findAllByUserId(userId)
        const isDuplicate = existingChannels
            .filter((ch) => (excludeId ? ch.id !== excludeId : true))
            .some((ch) => {
                try {
                    return this.cryptoService.decrypt(ch.url) === url
                } catch {
                    return false
                }
            })
        if (isDuplicate) {
            throw new BaseException(WEBHOOK_ERROR.DUPLICATE_URL, 'WebhookService.checkDuplicateUrl')
        }
    }

    /**
     * 본인 소유 채널 조회 (공통 검증)
     */
    private async findOwnChannel(id: number, userId: number): Promise<WebhookChannel> {
        const channel = await this.webhookRepository.findByIdAndUserId(id, userId)
        if (!channel) {
            throw new BaseException(WEBHOOK_ERROR.NOT_FOUND, 'WebhookService.findOwnChannel')
        }
        return channel
    }

    /**
     * 채널 응답 변환 (URL 마스킹)
     */
    private toResponse(channel: WebhookChannel): WebhookChannelResponseDto {
        let maskedUrl = '***'
        try {
            const decrypted = this.cryptoService.decrypt(channel.url)
            const halfLen = Math.floor(decrypted.length / 2)
            maskedUrl = decrypted.substring(0, halfLen) + '***'
        } catch {
            // 복호화 실패 시 마스킹
        }

        return {
            id: channel.id,
            name: channel.name,
            type: channel.type,
            url: maskedUrl,
            isActive: channel.isActive,
            createdAt: channel.createdAt
        }
    }
}
