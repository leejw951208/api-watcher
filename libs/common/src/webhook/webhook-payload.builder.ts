/**
 * Webhook 페이로드 빌더
 * Slack Block Kit / Generic JSON 포맷 생성
 */
export class WebhookPayloadBuilder {
    private static readonly COLOR_MAP = {
        DOWN: '#E01E5A',
        UP: '#2EB67D',
        SLOW: '#ECB22E',
        TEST: '#36C5F0'
    }

    private static readonly EMOJI_MAP = {
        DOWN: '🔴',
        UP: '🟢',
        SLOW: '🟡',
        TEST: '🔵'
    }

    private static readonly TITLE_MAP = {
        DOWN: '서비스 다운 감지',
        UP: '서비스 복구 완료',
        SLOW: '응답 지연 경고',
        TEST: '테스트 알림'
    }

    /**
     * Slack Block Kit 포맷 메시지 생성
     */
    static buildSlackPayload(type: string, endpointName: string): object {
        const alertType = type as keyof typeof WebhookPayloadBuilder.COLOR_MAP
        const color = this.COLOR_MAP[alertType] ?? '#808080'
        const emoji = this.EMOJI_MAP[alertType] ?? '⚪'
        const title = this.TITLE_MAP[alertType] ?? type
        const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })

        return {
            attachments: [
                {
                    color,
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: `${emoji} ${title}`,
                                emoji: true
                            }
                        },
                        {
                            type: 'section',
                            fields: [
                                { type: 'mrkdwn', text: `*엔드포인트:*\n${endpointName}` },
                                { type: 'mrkdwn', text: `*상태:*\n${type}` },
                                { type: 'mrkdwn', text: `*감지 시간:*\n${now}` }
                            ]
                        }
                    ]
                }
            ]
        }
    }

    /**
     * Generic JSON 페이로드 생성
     */
    static buildGenericPayload(type: string, endpointName: string, endpointId?: number): object {
        const eventMap: Record<string, string> = {
            DOWN: 'endpoint.down',
            UP: 'endpoint.up',
            SLOW: 'endpoint.slow',
            TEST: 'webhook.test'
        }

        const messageMap: Record<string, string> = {
            DOWN: `${endpointName} 엔드포인트가 연속 실패하여 장애 상태로 전환되었습니다.`,
            UP: `${endpointName} 엔드포인트가 정상 복구되었습니다.`,
            SLOW: `${endpointName} 엔드포인트의 응답 시간이 임계값을 초과했습니다.`,
            TEST: '테스트 알림입니다. Webhook 연동이 정상적으로 설정되었습니다.'
        }

        return {
            event: eventMap[type] ?? `endpoint.${type.toLowerCase()}`,
            timestamp: new Date().toISOString(),
            endpoint: {
                id: endpointId ?? null,
                name: endpointName
            },
            alert: {
                type,
                message: messageMap[type] ?? `${endpointName}: ${type}`
            }
        }
    }

    /**
     * 테스트 발송용 페이로드 생성
     */
    static buildTestPayload(channelType: string): object {
        if (channelType === 'SLACK') {
            return this.buildSlackPayload('TEST', 'API Watcher 테스트')
        }
        return this.buildGenericPayload('TEST', 'API Watcher 테스트')
    }
}
