import { PrismaService } from '@libs/prisma'
import { HttpService } from '@nestjs/axios'
import { Test, TestingModule } from '@nestjs/testing'
import { of, throwError } from 'rxjs'
import { CryptoService } from '../service/crypto.service'
import { WebhookDispatchService } from './webhook-dispatch.service'

// PrismaService Mock — 실제 DB 없이 테스트
const mockPrisma = {
    webhookChannel: {
        findMany: jest.fn(),
        findFirst: jest.fn()
    },
    webhookLog: {
        create: jest.fn()
    }
}

// CryptoService Mock
const mockCryptoService = {
    decrypt: jest.fn()
}

// HttpService Mock
const mockHttpService = {
    post: jest.fn()
}

// delay를 즉시 resolve로 대체하여 테스트 속도 개선
jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
    fn()
    return 0 as any
})

describe('WebhookDispatchService', () => {
    let service: WebhookDispatchService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhookDispatchService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: CryptoService, useValue: mockCryptoService },
                { provide: HttpService, useValue: mockHttpService }
            ]
        }).compile()

        service = module.get<WebhookDispatchService>(WebhookDispatchService)

        // delay 메서드를 즉시 resolve로 교체
        jest.spyOn(service as any, 'delay').mockResolvedValue(undefined)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('서비스가 정의되어 있다', () => {
        expect(service).toBeDefined()
    })

    // ─────────────────────────────────────────────
    // dispatchAll
    // ─────────────────────────────────────────────
    describe('dispatchAll', () => {
        it('활성화된 채널이 없으면 HTTP 요청을 보내지 않는다', async () => {
            mockPrisma.webhookChannel.findMany.mockResolvedValue([])

            await service.dispatchAll(1, 100, 'DOWN', '결제 API')

            expect(mockHttpService.post).not.toHaveBeenCalled()
        })

        it('활성화된 채널이 있으면 각 채널로 HTTP POST 요청을 보낸다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T00/B00/xxx'
            const channels = [
                { id: 1, type: 'SLACK', url: 'ENC_URL_1', name: '슬랙 채널' }
            ]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', '결제 API')

            expect(mockHttpService.post).toHaveBeenCalledTimes(1)
            expect(mockHttpService.post).toHaveBeenCalledWith(
                decryptedUrl,
                expect.any(Object),
                { timeout: 10000 }
            )
        })

        it('여러 채널이 있으면 모든 채널로 병렬 발송한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [
                { id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙 1' },
                { id: 2, type: 'GENERIC', url: 'ENC_2', name: '제네릭 1' },
                { id: 3, type: 'SLACK', url: 'ENC_3', name: '슬랙 2' }
            ]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'UP', '서비스명')

            expect(mockHttpService.post).toHaveBeenCalledTimes(3)
        })

        it('SLACK 채널에는 attachments 구조의 페이로드를 전송한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', '결제 API')

            const sentPayload = mockHttpService.post.mock.calls[0][1]
            expect(sentPayload).toHaveProperty('attachments')
        })

        it('GENERIC 채널에는 event 필드를 포함한 페이로드를 전송한다', async () => {
            const decryptedUrl = 'https://myserver.com/webhook'
            const channels = [{ id: 1, type: 'GENERIC', url: 'ENC_1', name: '제네릭' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', '결제 API')

            const sentPayload = mockHttpService.post.mock.calls[0][1]
            expect(sentPayload).toHaveProperty('event')
        })

        it('발송 성공 시 isSuccess=true로 로그를 저장한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        isSuccess: true,
                        statusCode: 200
                    })
                })
            )
        })

        it('모든 재시도 실패 시 isSuccess=false로 로그를 저장한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]
            const networkError = new Error('ECONNREFUSED')

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            // 모든 시도(4회)에서 실패
            mockHttpService.post.mockReturnValue(throwError(() => networkError))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        isSuccess: false,
                        errorMessage: networkError.message
                    })
                })
            )
        })

        it('일부 채널 실패해도 나머지 채널 발송을 계속한다 (Promise.allSettled)', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [
                { id: 1, type: 'SLACK', url: 'ENC_1', name: '성공 채널' },
                { id: 2, type: 'SLACK', url: 'ENC_2', name: '실패 채널' }
            ]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post
                .mockReturnValueOnce(of({ status: 200, data: {} }))   // 첫 번째 채널 성공
                .mockReturnValue(throwError(() => new Error('실패'))) // 나머지 재시도 실패
            mockPrisma.webhookLog.create.mockResolvedValue({})

            // 예외 없이 완료되어야 함
            await expect(service.dispatchAll(1, 100, 'DOWN', 'API')).resolves.not.toThrow()
        })
    })

    // ─────────────────────────────────────────────
    // 재시도 로직 (dispatchToChannel 내부)
    // ─────────────────────────────────────────────
    describe('재시도 로직', () => {
        it('첫 번째 시도 실패 후 재시도하여 성공하면 성공 로그를 저장한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post
                .mockReturnValueOnce(throwError(() => new Error('첫 번째 실패')))
                .mockReturnValueOnce(of({ status: 200, data: {} }))  // 두 번째(재시도 1회)에서 성공
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ isSuccess: true })
                })
            )
        })

        it('최대 재시도(3회) 후에도 실패하면 총 4번(1+3) HTTP 요청을 시도한다', async () => {
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => new Error('항상 실패')))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            // 초기 시도(attempt=0) + 재시도 3회 = 총 4회
            expect(mockHttpService.post).toHaveBeenCalledTimes(4)
        })

        it('재시도 사이 delay를 호출한다', async () => {
            const delaySpy = jest.spyOn(service as any, 'delay').mockResolvedValue(undefined)
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => new Error('실패')))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            // 재시도 3회 → delay 3회 호출
            expect(delaySpy).toHaveBeenCalledTimes(3)
        })

        it('재시도 delay는 1000ms → 5000ms → 15000ms 순서로 증가한다', async () => {
            const delaySpy = jest.spyOn(service as any, 'delay').mockResolvedValue(undefined)
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'
            const channels = [{ id: 1, type: 'SLACK', url: 'ENC_1', name: '슬랙' }]

            mockPrisma.webhookChannel.findMany.mockResolvedValue(channels)
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => new Error('실패')))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchAll(1, 100, 'DOWN', 'API')

            expect(delaySpy).toHaveBeenNthCalledWith(1, 1000)
            expect(delaySpy).toHaveBeenNthCalledWith(2, 5000)
            expect(delaySpy).toHaveBeenNthCalledWith(3, 15000)
        })
    })

    // ─────────────────────────────────────────────
    // dispatchTest
    // ─────────────────────────────────────────────
    describe('dispatchTest', () => {
        const slackChannel = { id: 1, type: 'SLACK', url: 'ENC_URL', name: '슬랙', userId: 10, isDeleted: false }
        const genericChannel = { id: 1, type: 'GENERIC', url: 'ENC_URL', name: '제네릭', userId: 10, isDeleted: false }
        const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'

        it('발송 성공 시 success=true, statusCode, 성공 메시지를 반환한다', async () => {
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            const result = await service.dispatchTest(slackChannel, 10)

            expect(result.success).toBe(true)
            expect(result.statusCode).toBe(200)
            expect(result.message).toContain('성공')
        })

        it('발송 실패 시 success=false, 에러 메시지를 반환한다 (예외 미전파)', async () => {
            const errorMessage = '연결 시간 초과'

            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => new Error(errorMessage)))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            const result = await service.dispatchTest(slackChannel, 10)

            expect(result.success).toBe(false)
            expect(result.message).toContain(errorMessage)
        })

        it('테스트 발송 성공 시 TEST 타입 로그를 저장한다', async () => {
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchTest(slackChannel, 10)

            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        channelId: 1,
                        endpointId: null,
                        alertType: 'TEST',
                        isSuccess: true,
                        retryCount: 0
                    })
                })
            )
        })

        it('테스트 발송 실패 시 TEST 타입 실패 로그를 저장한다', async () => {
            const errorMessage = '타임아웃'

            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => new Error(errorMessage)))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchTest(slackChannel, 10)

            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        alertType: 'TEST',
                        isSuccess: false,
                        errorMessage
                    })
                })
            )
        })

        it('SLACK 채널이면 Slack 테스트 페이로드(attachments 구조)를 발송한다', async () => {
            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchTest(slackChannel, 10)

            const sentPayload = mockHttpService.post.mock.calls[0][1]
            expect(sentPayload).toHaveProperty('attachments')
        })

        it('GENERIC 채널이면 Generic 테스트 페이로드(event 필드)를 발송한다', async () => {
            mockCryptoService.decrypt.mockReturnValue('https://myserver.com/webhook')
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            await service.dispatchTest(genericChannel, 10)

            const sentPayload = mockHttpService.post.mock.calls[0][1]
            expect(sentPayload).toHaveProperty('event')
            expect((sentPayload as any).event).toBe('webhook.test')
        })

        it('HTTP 응답에 status 코드가 있으면 실패 로그에 statusCode를 기록한다', async () => {
            const httpError = Object.assign(new Error('Bad Request'), { response: { status: 400 } })

            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(throwError(() => httpError))
            mockPrisma.webhookLog.create.mockResolvedValue({})

            const result = await service.dispatchTest(slackChannel, 10)

            expect(result.statusCode).toBe(400)
            expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ statusCode: 400 })
                })
            )
        })
    })

    // ─────────────────────────────────────────────
    // 로그 저장 실패 내성
    // ─────────────────────────────────────────────
    describe('로그 저장 실패 처리', () => {
        it('로그 저장이 실패해도 발송 결과에는 영향을 주지 않는다', async () => {
            const channel = { id: 1, type: 'SLACK', url: 'ENC_URL', name: '슬랙', userId: 10, isDeleted: false }
            const decryptedUrl = 'https://hooks.slack.com/services/T/B/xxx'

            mockCryptoService.decrypt.mockReturnValue(decryptedUrl)
            mockHttpService.post.mockReturnValue(of({ status: 200, data: {} }))
            mockPrisma.webhookLog.create.mockRejectedValue(new Error('DB 연결 오류'))

            const result = await service.dispatchTest(channel, 10)
            expect(result.success).toBe(true)
        })
    })
})
