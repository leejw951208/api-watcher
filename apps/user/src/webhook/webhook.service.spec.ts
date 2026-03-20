import { BaseException, CryptoService, WebhookDispatchService, WEBHOOK_ERROR } from '@libs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { CreateWebhookChannelDto } from './dto/create-webhook-channel.dto'
import { UpdateWebhookChannelDto } from './dto/update-webhook-channel.dto'
import { WebhookRepository } from './webhook.repository'
import { WebhookService } from './webhook.service'

// 공통 픽스처 헬퍼
function makeChannel(overrides: Partial<any> = {}): any {
    return {
        id: 1,
        userId: 10,
        name: '팀 슬랙',
        type: 'SLACK',
        url: 'ENCRYPTED_URL',
        isActive: true,
        createdAt: new Date('2026-03-20'),
        ...overrides
    }
}

describe('WebhookService', () => {
    let service: WebhookService

    // ── 의존성 Mock ──────────────────────────────────────────────────────────
    const mockWebhookRepository = {
        create: jest.fn(),
        findAllByUserId: jest.fn(),
        findByIdAndUserId: jest.fn(),
        countByUserId: jest.fn(),
        update: jest.fn(),
        softDelete: jest.fn(),
        findLogsByChannelId: jest.fn()
    }

    const mockCryptoService = {
        encrypt: jest.fn(),
        decrypt: jest.fn()
    }

    const mockWebhookDispatchService = {
        dispatchTest: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhookService,
                { provide: WebhookRepository, useValue: mockWebhookRepository },
                { provide: CryptoService, useValue: mockCryptoService },
                { provide: WebhookDispatchService, useValue: mockWebhookDispatchService }
            ]
        }).compile()

        service = module.get<WebhookService>(WebhookService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('서비스가 정의되어 있다', () => {
        expect(service).toBeDefined()
    })

    // ─────────────────────────────────────────────
    // create
    // ─────────────────────────────────────────────
    describe('create', () => {
        const userId = 10
        const validSlackDto: CreateWebhookChannelDto = {
            name: '팀 슬랙',
            type: 'SLACK' as any,
            url: 'https://hooks.slack.com/services/T00/B00/xxx'
        }

        it('정상 입력이면 채널을 생성하고 마스킹된 URL을 반환한다', async () => {
            const encrypted = 'ENC_URL'
            const saved = makeChannel({ url: encrypted })

            mockWebhookRepository.countByUserId.mockResolvedValue(0)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([])
            mockCryptoService.encrypt.mockReturnValue(encrypted)
            mockCryptoService.decrypt.mockReturnValue(validSlackDto.url)
            mockWebhookRepository.create.mockResolvedValue(saved)

            const result = await service.create(userId, validSlackDto)

            expect(mockWebhookRepository.create).toHaveBeenCalledWith({
                userId,
                name: validSlackDto.name,
                type: validSlackDto.type,
                url: encrypted
            })
            // URL은 마스킹 처리되어야 함
            expect(result.url).not.toBe(validSlackDto.url)
            expect(result.url).toContain('***')
        })

        it('SLACK 타입이고 URL이 https://hooks.slack.com/으로 시작하지 않으면 INVALID_URL 예외를 던진다', async () => {
            const invalidDto: CreateWebhookChannelDto = {
                name: '잘못된 슬랙',
                type: 'SLACK' as any,
                url: 'https://example.com/webhook'
            }

            await expect(service.create(userId, invalidDto)).rejects.toThrow(BaseException)
            await expect(service.create(userId, invalidDto)).rejects.toThrow(WEBHOOK_ERROR.INVALID_URL.message)
        })

        it('SLACK 타입이 아닌 Generic 채널은 URL 프리픽스 검사를 하지 않는다', async () => {
            const genericDto: CreateWebhookChannelDto = {
                name: '커스텀 웹훅',
                type: 'GENERIC' as any,
                url: 'https://myserver.com/webhook'
            }
            const encrypted = 'ENC_GENERIC'
            const saved = makeChannel({ type: 'GENERIC', url: encrypted })

            mockWebhookRepository.countByUserId.mockResolvedValue(0)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([])
            mockCryptoService.encrypt.mockReturnValue(encrypted)
            mockCryptoService.decrypt.mockReturnValue(genericDto.url)
            mockWebhookRepository.create.mockResolvedValue(saved)

            // GENERIC 타입은 URL 검증 없이 생성 가능해야 함
            await expect(service.create(userId, genericDto)).resolves.not.toThrow()
        })

        it('채널 수가 5개 이상이면 CHANNEL_LIMIT_EXCEEDED 예외를 던진다', async () => {
            const dto = { ...validSlackDto }

            mockWebhookRepository.countByUserId.mockResolvedValue(5)

            await expect(service.create(userId, dto)).rejects.toThrow(BaseException)
            await expect(service.create(userId, dto)).rejects.toThrow(WEBHOOK_ERROR.CHANNEL_LIMIT_EXCEEDED.message)
            expect(mockWebhookRepository.create).not.toHaveBeenCalled()
        })

        it('채널 수가 정확히 4개면 생성에 성공한다 (경계값)', async () => {
            const encrypted = 'ENC_URL'
            const saved = makeChannel({ url: encrypted })

            mockWebhookRepository.countByUserId.mockResolvedValue(4)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([])
            mockCryptoService.encrypt.mockReturnValue(encrypted)
            mockCryptoService.decrypt.mockReturnValue(validSlackDto.url)
            mockWebhookRepository.create.mockResolvedValue(saved)

            await expect(service.create(userId, validSlackDto)).resolves.not.toThrow()
        })

        it('동일한 URL이 이미 존재하면 DUPLICATE_URL 예외를 던진다', async () => {
            const existingEncrypted = 'ENC_EXISTING'
            const existing = makeChannel({ url: existingEncrypted })

            mockWebhookRepository.countByUserId.mockResolvedValue(1)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([existing])
            // 기존 채널 복호화 시 동일한 URL 반환 → 중복 판정
            mockCryptoService.decrypt.mockReturnValue(validSlackDto.url)

            await expect(service.create(userId, validSlackDto)).rejects.toThrow(BaseException)
            await expect(service.create(userId, validSlackDto)).rejects.toThrow(WEBHOOK_ERROR.DUPLICATE_URL.message)
        })

        it('복호화에 실패한 기존 채널은 중복 비교에서 제외한다', async () => {
            const existing = makeChannel({ url: 'BROKEN_ENCRYPTED' })
            const newEncrypted = 'NEW_ENC'
            const saved = makeChannel({ url: newEncrypted })

            mockWebhookRepository.countByUserId.mockResolvedValue(1)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([existing])
            // 기존 채널 복호화 실패 → 중복 아님으로 처리
            mockCryptoService.decrypt.mockImplementationOnce(() => {
                throw new Error('복호화 실패')
            })
            mockCryptoService.encrypt.mockReturnValue(newEncrypted)
            // 새 채널 toResponse 에서 복호화
            mockCryptoService.decrypt.mockReturnValue(validSlackDto.url)
            mockWebhookRepository.create.mockResolvedValue(saved)

            await expect(service.create(userId, validSlackDto)).resolves.not.toThrow()
        })
    })

    // ─────────────────────────────────────────────
    // findAll
    // ─────────────────────────────────────────────
    describe('findAll', () => {
        it('채널 목록을 마스킹된 URL로 반환한다', async () => {
            const userId = 10
            const rawUrl = 'https://hooks.slack.com/services/T00/B00/xxx'
            const channels = [makeChannel({ url: 'ENC_1' }), makeChannel({ id: 2, url: 'ENC_2' })]

            mockWebhookRepository.findAllByUserId.mockResolvedValue(channels)
            // 각 채널 복호화 시 동일 URL 반환 (두 번 호출)
            mockCryptoService.decrypt.mockReturnValue(rawUrl)

            const result = await service.findAll(userId)

            expect(result).toHaveLength(2)
            result.forEach((ch: any) => {
                expect(ch.url).not.toBe(rawUrl)
                expect(ch.url).toContain('***')
            })
        })

        it('채널이 없으면 빈 배열을 반환한다', async () => {
            mockWebhookRepository.findAllByUserId.mockResolvedValue([])

            const result = await service.findAll(10)

            expect(result).toEqual([])
        })
    })

    // ─────────────────────────────────────────────
    // findOne
    // ─────────────────────────────────────────────
    describe('findOne', () => {
        it('본인 소유 채널이면 마스킹된 URL과 함께 반환한다', async () => {
            const channel = makeChannel({ url: 'ENC_URL' })
            const rawUrl = 'https://hooks.slack.com/services/T00/B00/xxx'

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockCryptoService.decrypt.mockReturnValue(rawUrl)

            const result = await service.findOne(1, 10)

            expect(result.id).toBe(1)
            expect(result.url).toContain('***')
        })

        it('채널이 존재하지 않으면 NOT_FOUND 예외를 던진다', async () => {
            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.findOne(999, 10)).rejects.toThrow(BaseException)
            await expect(service.findOne(999, 10)).rejects.toThrow(WEBHOOK_ERROR.NOT_FOUND.message)
        })
    })

    // ─────────────────────────────────────────────
    // update
    // ─────────────────────────────────────────────
    describe('update', () => {
        it('이름만 변경하면 name만 update에 전달된다', async () => {
            const channel = makeChannel()
            const dto: UpdateWebhookChannelDto = { name: '새 이름' }
            const updated = { ...channel, name: '새 이름' }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.update.mockResolvedValue(updated)
            mockCryptoService.decrypt.mockReturnValue('https://hooks.slack.com/services/T00/B00/xxx')

            await service.update(1, 10, dto)

            expect(mockWebhookRepository.update).toHaveBeenCalledWith(1, { name: '새 이름' })
            expect(mockCryptoService.encrypt).not.toHaveBeenCalled()
        })

        it('isActive만 변경하면 isActive만 update에 전달된다', async () => {
            const channel = makeChannel()
            const dto: UpdateWebhookChannelDto = { isActive: false }
            const updated = { ...channel, isActive: false }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.update.mockResolvedValue(updated)
            mockCryptoService.decrypt.mockReturnValue('https://hooks.slack.com/services/T00/B00/xxx')

            await service.update(1, 10, dto)

            expect(mockWebhookRepository.update).toHaveBeenCalledWith(1, { isActive: false })
        })

        it('url을 변경하면 중복 검사 후 암호화하여 update에 전달된다', async () => {
            const channel = makeChannel()
            const newUrl = 'https://hooks.slack.com/services/NEW/URL/xxx'
            const newEncrypted = 'NEW_ENC_URL'
            const dto: UpdateWebhookChannelDto = { url: newUrl }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.findAllByUserId.mockResolvedValue([channel])
            // 기존 채널 복호화 시 다른 URL → 중복 아님
            mockCryptoService.decrypt.mockReturnValueOnce('https://hooks.slack.com/services/OLD/URL/xxx')
            mockCryptoService.encrypt.mockReturnValue(newEncrypted)
            mockWebhookRepository.update.mockResolvedValue({ ...channel, url: newEncrypted })
            mockCryptoService.decrypt.mockReturnValue(newUrl)

            await service.update(1, 10, dto)

            expect(mockWebhookRepository.findAllByUserId).toHaveBeenCalledWith(10)
            expect(mockCryptoService.encrypt).toHaveBeenCalledWith(newUrl)
            expect(mockWebhookRepository.update).toHaveBeenCalledWith(1, { url: newEncrypted })
        })

        it('채널이 존재하지 않으면 NOT_FOUND 예외를 던진다', async () => {
            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.update(999, 10, { name: '이름' })).rejects.toThrow(BaseException)
            await expect(service.update(999, 10, { name: '이름' })).rejects.toThrow(WEBHOOK_ERROR.NOT_FOUND.message)
        })

        it('수정 결과를 마스킹된 URL로 반환한다', async () => {
            const channel = makeChannel()
            const dto: UpdateWebhookChannelDto = { name: '업데이트됨' }
            const updated = { ...channel, name: '업데이트됨' }
            const rawUrl = 'https://hooks.slack.com/services/T00/B00/xxx'

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.update.mockResolvedValue(updated)
            mockCryptoService.decrypt.mockReturnValue(rawUrl)

            const result = await service.update(1, 10, dto)

            expect(result.url).toContain('***')
            expect(result.url).not.toBe(rawUrl)
        })
    })

    // ─────────────────────────────────────────────
    // remove
    // ─────────────────────────────────────────────
    describe('remove', () => {
        it('본인 소유 채널이면 소프트 삭제를 호출한다', async () => {
            const channel = makeChannel()

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.softDelete.mockResolvedValue({ ...channel, isDeleted: true })

            await service.remove(1, 10)

            expect(mockWebhookRepository.softDelete).toHaveBeenCalledWith(1)
        })

        it('채널이 존재하지 않으면 NOT_FOUND 예외를 던진다', async () => {
            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.remove(999, 10)).rejects.toThrow(BaseException)
            await expect(service.remove(999, 10)).rejects.toThrow(WEBHOOK_ERROR.NOT_FOUND.message)
            expect(mockWebhookRepository.softDelete).not.toHaveBeenCalled()
        })
    })

    // ─────────────────────────────────────────────
    // testDispatch
    // ─────────────────────────────────────────────
    describe('testDispatch', () => {
        it('본인 소유 채널이면 dispatchTest를 호출하고 결과를 반환한다', async () => {
            const channel = makeChannel()
            const dispatchResult = { success: true, statusCode: 200, message: '테스트 발송 성공' }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookDispatchService.dispatchTest.mockResolvedValue(dispatchResult)

            const result = await service.testDispatch(1, 10)

            expect(mockWebhookDispatchService.dispatchTest).toHaveBeenCalledWith(channel, 10)
            expect(result).toEqual(dispatchResult)
        })

        it('채널이 존재하지 않으면 NOT_FOUND 예외를 던진다', async () => {
            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(null)

            await expect(service.testDispatch(999, 10)).rejects.toThrow(BaseException)
            await expect(service.testDispatch(999, 10)).rejects.toThrow(WEBHOOK_ERROR.NOT_FOUND.message)
            expect(mockWebhookDispatchService.dispatchTest).not.toHaveBeenCalled()
        })

        it('dispatchTest가 실패 결과를 반환해도 예외를 던지지 않는다', async () => {
            const channel = makeChannel()
            const failResult = { success: false, statusCode: 500, message: '테스트 발송 실패: 연결 거부됨' }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookDispatchService.dispatchTest.mockResolvedValue(failResult)

            const result = await service.testDispatch(1, 10)

            expect(result.success).toBe(false)
            expect(result.message).toContain('실패')
        })
    })

    // ─────────────────────────────────────────────
    // findLogs
    // ─────────────────────────────────────────────
    describe('findLogs', () => {
        it('본인 소유 채널의 로그를 페이지네이션하여 반환한다', async () => {
            const channel = makeChannel()
            const logs = {
                items: [
                    { id: 1, alertType: 'DOWN', statusCode: 200, isSuccess: true, retryCount: 0, errorMessage: null, createdAt: new Date() }
                ],
                totalCount: 1
            }
            const query = { page: 1, size: 20, order: 'desc' as const }

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockWebhookRepository.findLogsByChannelId.mockResolvedValue(logs)

            const result = await service.findLogs(1, 10, query)

            expect(mockWebhookRepository.findLogsByChannelId).toHaveBeenCalledWith(1, 1, 20)
            expect(result.data).toEqual(logs.items)
        })

        it('채널이 존재하지 않으면 NOT_FOUND 예외를 던진다', async () => {
            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(null)
            const query = { page: 1, size: 20, order: 'desc' as const }

            await expect(service.findLogs(999, 10, query)).rejects.toThrow(BaseException)
            await expect(service.findLogs(999, 10, query)).rejects.toThrow(WEBHOOK_ERROR.NOT_FOUND.message)
            expect(mockWebhookRepository.findLogsByChannelId).not.toHaveBeenCalled()
        })
    })

    // ─────────────────────────────────────────────
    // URL 마스킹 (toResponse 내부 로직)
    // ─────────────────────────────────────────────
    describe('URL 마스킹', () => {
        it('URL의 앞 절반만 노출하고 나머지는 ***로 마스킹한다', async () => {
            const rawUrl = 'https://hooks.slack.com/services/T00/B00/secretkey'
            // 앞 절반 = rawUrl.substring(0, Math.floor(rawUrl.length / 2))
            const expectedPrefix = rawUrl.substring(0, Math.floor(rawUrl.length / 2))
            const channel = makeChannel({ url: 'ENC_URL' })

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockCryptoService.decrypt.mockReturnValue(rawUrl)

            const result = await service.findOne(1, 10)

            expect(result.url).toBe(`${expectedPrefix}***`)
        })

        it('복호화에 실패하면 URL을 ***로 반환한다', async () => {
            const channel = makeChannel({ url: 'BROKEN_ENC' })

            mockWebhookRepository.findByIdAndUserId.mockResolvedValue(channel)
            mockCryptoService.decrypt.mockImplementation(() => {
                throw new Error('복호화 오류')
            })

            const result = await service.findOne(1, 10)

            expect(result.url).toBe('***')
        })
    })
})
