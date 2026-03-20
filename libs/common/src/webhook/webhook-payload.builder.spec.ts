import { WebhookPayloadBuilder } from './webhook-payload.builder'

describe('WebhookPayloadBuilder', () => {
    // 테스트 실행 시간 고정 (날짜 의존 검증 회피)
    beforeAll(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-03-20T10:00:00.000Z'))
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    // ─────────────────────────────────────────────
    // buildSlackPayload
    // ─────────────────────────────────────────────
    describe('buildSlackPayload', () => {
        it('DOWN 타입이면 빨간색(#E01E5A)과 🔴 이모지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('DOWN', '결제 API') as any

            expect(result.attachments).toHaveLength(1)
            expect(result.attachments[0].color).toBe('#E01E5A')

            const headerBlock = result.attachments[0].blocks[0]
            expect(headerBlock.text.text).toContain('🔴')
            expect(headerBlock.text.text).toContain('서비스 다운 감지')
        })

        it('UP 타입이면 초록색(#2EB67D)과 🟢 이모지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('UP', '결제 API') as any

            expect(result.attachments[0].color).toBe('#2EB67D')
            expect(result.attachments[0].blocks[0].text.text).toContain('🟢')
            expect(result.attachments[0].blocks[0].text.text).toContain('서비스 복구 완료')
        })

        it('SLOW 타입이면 노란색(#ECB22E)과 🟡 이모지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('SLOW', '결제 API') as any

            expect(result.attachments[0].color).toBe('#ECB22E')
            expect(result.attachments[0].blocks[0].text.text).toContain('🟡')
            expect(result.attachments[0].blocks[0].text.text).toContain('응답 지연 경고')
        })

        it('TEST 타입이면 파란색(#36C5F0)과 🔵 이모지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('TEST', '테스트 엔드포인트') as any

            expect(result.attachments[0].color).toBe('#36C5F0')
            expect(result.attachments[0].blocks[0].text.text).toContain('🔵')
            expect(result.attachments[0].blocks[0].text.text).toContain('테스트 알림')
        })

        it('알 수 없는 타입이면 기본 회색(#808080)과 ⚪ 이모지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('UNKNOWN', '엔드포인트') as any

            expect(result.attachments[0].color).toBe('#808080')
            expect(result.attachments[0].blocks[0].text.text).toContain('⚪')
            // 알 수 없는 타입이면 type 값 자체를 제목으로 사용
            expect(result.attachments[0].blocks[0].text.text).toContain('UNKNOWN')
        })

        it('section 블록에 엔드포인트명, 상태, 감지 시간 필드가 포함된다', () => {
            const endpointName = '사용자 인증 API'
            const result = WebhookPayloadBuilder.buildSlackPayload('DOWN', endpointName) as any

            const sectionBlock = result.attachments[0].blocks[1]
            expect(sectionBlock.type).toBe('section')
            expect(sectionBlock.fields).toHaveLength(3)

            const texts = sectionBlock.fields.map((f: any) => f.text)
            expect(texts.some((t: string) => t.includes(endpointName))).toBe(true)
            expect(texts.some((t: string) => t.includes('DOWN'))).toBe(true)
            expect(texts.some((t: string) => t.includes('감지 시간'))).toBe(true)
        })

        it('모든 필드 타입이 mrkdwn이다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('UP', '검색 API') as any

            const sectionBlock = result.attachments[0].blocks[1]
            sectionBlock.fields.forEach((field: any) => {
                expect(field.type).toBe('mrkdwn')
            })
        })

        it('header 블록의 emoji 옵션이 true다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('DOWN', 'API') as any

            const headerBlock = result.attachments[0].blocks[0]
            expect(headerBlock.type).toBe('header')
            expect(headerBlock.text.type).toBe('plain_text')
            expect(headerBlock.text.emoji).toBe(true)
        })

        it('attachments 구조가 Slack Block Kit 스펙을 따른다', () => {
            const result = WebhookPayloadBuilder.buildSlackPayload('DOWN', 'API') as any

            expect(result).toHaveProperty('attachments')
            expect(Array.isArray(result.attachments)).toBe(true)
            expect(result.attachments[0]).toHaveProperty('color')
            expect(result.attachments[0]).toHaveProperty('blocks')
            expect(Array.isArray(result.attachments[0].blocks)).toBe(true)
        })
    })

    // ─────────────────────────────────────────────
    // buildGenericPayload
    // ─────────────────────────────────────────────
    describe('buildGenericPayload', () => {
        it('DOWN 타입이면 event가 endpoint.down이고 장애 메시지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('DOWN', '결제 API', 1) as any

            expect(result.event).toBe('endpoint.down')
            expect(result.alert.type).toBe('DOWN')
            expect(result.alert.message).toContain('결제 API')
            expect(result.alert.message).toContain('장애 상태')
        })

        it('UP 타입이면 event가 endpoint.up이고 복구 메시지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('UP', '결제 API', 1) as any

            expect(result.event).toBe('endpoint.up')
            expect(result.alert.message).toContain('정상 복구')
        })

        it('SLOW 타입이면 event가 endpoint.slow이고 지연 메시지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('SLOW', '검색 API', 2) as any

            expect(result.event).toBe('endpoint.slow')
            expect(result.alert.message).toContain('임계값')
        })

        it('TEST 타입이면 event가 webhook.test이고 테스트 메시지를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('TEST', 'API Watcher 테스트') as any

            expect(result.event).toBe('webhook.test')
            expect(result.alert.message).toContain('Webhook 연동이 정상적으로 설정')
        })

        it('알 수 없는 타입이면 event가 endpoint.{소문자타입} 형태다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('CUSTOM', '엔드포인트') as any

            expect(result.event).toBe('endpoint.custom')
        })

        it('endpointId를 전달하면 endpoint.id에 반영된다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('DOWN', '결제 API', 42) as any

            expect(result.endpoint.id).toBe(42)
            expect(result.endpoint.name).toBe('결제 API')
        })

        it('endpointId를 생략하면 endpoint.id가 null이다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('DOWN', '결제 API') as any

            expect(result.endpoint.id).toBeNull()
        })

        it('timestamp 필드가 ISO 8601 형식이다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('DOWN', 'API', 1) as any

            expect(result.timestamp).toBeDefined()
            // ISO 8601 형식 검증
            expect(() => new Date(result.timestamp)).not.toThrow()
            expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp)
        })

        it('반환 객체에 event, timestamp, endpoint, alert 필드가 존재한다', () => {
            const result = WebhookPayloadBuilder.buildGenericPayload('UP', '서비스', 1) as any

            expect(result).toHaveProperty('event')
            expect(result).toHaveProperty('timestamp')
            expect(result).toHaveProperty('endpoint')
            expect(result).toHaveProperty('alert')
        })
    })

    // ─────────────────────────────────────────────
    // buildTestPayload
    // ─────────────────────────────────────────────
    describe('buildTestPayload', () => {
        it('채널 타입이 SLACK이면 Slack Block Kit 구조를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildTestPayload('SLACK') as any

            // Slack 페이로드는 attachments를 포함한다
            expect(result).toHaveProperty('attachments')
            expect(result.attachments[0].color).toBe('#36C5F0')
        })

        it('SLACK 타입 테스트 페이로드의 엔드포인트명은 "API Watcher 테스트"다', () => {
            const result = WebhookPayloadBuilder.buildTestPayload('SLACK') as any

            const sectionBlock = result.attachments[0].blocks[1]
            const endpointField = sectionBlock.fields.find((f: any) => f.text.includes('엔드포인트'))
            expect(endpointField.text).toContain('API Watcher 테스트')
        })

        it('채널 타입이 GENERIC이면 Generic JSON 구조를 반환한다', () => {
            const result = WebhookPayloadBuilder.buildTestPayload('GENERIC') as any

            // Generic 페이로드는 event 필드를 포함한다
            expect(result).toHaveProperty('event')
            expect(result.event).toBe('webhook.test')
        })

        it('GENERIC 타입 테스트 페이로드의 엔드포인트명은 "API Watcher 테스트"다', () => {
            const result = WebhookPayloadBuilder.buildTestPayload('GENERIC') as any

            expect(result.endpoint.name).toBe('API Watcher 테스트')
        })

        it('알 수 없는 채널 타입이면 Generic JSON 구조를 반환한다 (기본값)', () => {
            const result = WebhookPayloadBuilder.buildTestPayload('UNKNOWN') as any

            expect(result).toHaveProperty('event')
            expect(result.event).toBe('webhook.test')
        })

        it('SLACK 테스트 페이로드와 GENERIC 테스트 페이로드는 구조가 다르다', () => {
            const slackResult = WebhookPayloadBuilder.buildTestPayload('SLACK') as any
            const genericResult = WebhookPayloadBuilder.buildTestPayload('GENERIC') as any

            expect(slackResult).toHaveProperty('attachments')
            expect(genericResult).not.toHaveProperty('attachments')
            expect(genericResult).toHaveProperty('event')
            expect(slackResult).not.toHaveProperty('event')
        })
    })
})
