# Webhook/Slack 알림 연동 Design Document

> **Summary**: 모니터링 상태 변경 시 Webhook/Slack으로 실시간 외부 알림을 발송하는 기능의 상세 설계
>
> **Project**: api-watcher
> **Author**: Claude
> **Date**: 2026-03-20
> **Status**: Draft
> **Planning Doc**: [webhook-slack-alert.plan.md](../../01-plan/features/webhook-slack-alert.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 기존 `MonitoringAlertService`를 최소한으로 수정하여 Webhook 발송 기능을 통합
- 비동기 fire-and-forget 패턴으로 스케줄러 성능에 영향 없이 외부 알림 발송
- Slack Block Kit과 Generic JSON 두 가지 포맷을 지원하는 확장 가능한 구조
- 기존 프로젝트 패턴(Module/Controller/Service/Repository)을 일관되게 따름

### 1.2 Design Principles

- **관심사 분리**: Webhook 관련 로직은 `@libs/common/webhook/`에 독립 모듈로 분리
- **기존 인프라 재활용**: CryptoService(AES-256), Redis(쿨다운), BaseException 패턴 활용
- **비침투적 통합**: MonitoringAlertService에 1개 메서드 호출만 추가

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    apps/user/src/webhook/                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ WebhookController│→│ WebhookService   │→│WebhookRepo   │ │
│  │ (CRUD + Test)    │  │ (비즈니스 로직)    │  │(Prisma 쿼리) │ │
│  └─────────────────┘  └──────────────────┘  └─────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   apps/admin/src/webhook/                      │
│  ┌─────────────────────┐  ┌──────────────────────┐           │
│  │ AdminWebhookController│→│ AdminWebhookService  │           │
│  │ (현황 조회)            │  │ (관리자 조회)          │           │
│  └─────────────────────┘  └──────────────────────┘           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                libs/common/src/webhook/                        │
│  ┌─────────────────────┐  ┌──────────────────────┐           │
│  │WebhookDispatchService│  │WebhookPayloadBuilder │           │
│  │(발송 + 재시도 + 로그)  │  │(Slack/Generic 포맷)   │           │
│  └─────────────────────┘  └──────────────────────┘           │
│  ┌─────────────────────┐                                      │
│  │ WebhookCommonModule  │                                      │
│  └─────────────────────┘                                      │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. Webhook 등록 Flow:
   User → WebhookController.create() → WebhookService.create()
     → URL 암호화(CryptoService) → DB 저장 → 테스트 발송(optional)

2. 알림 발송 Flow:
   MonitoringSchedulerService → 상태 변경 감지
     → MonitoringAlertService.sendAlert()
       ├→ Notification 생성 (기존, 동기)
       └→ WebhookDispatchService.dispatchAll() (신규, 비동기)
            → 사용자의 활성 WebhookChannel 조회
            → URL 복호화
            → 채널 타입별 payload 생성 (Slack Block Kit / Generic JSON)
            → HTTP POST 발송
            → 실패 시 재시도 (1s → 5s → 15s)
            → WebhookLog 저장
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| WebhookController | WebhookService | CRUD 비즈니스 로직 |
| WebhookService | WebhookRepository, CryptoService | 데이터 관리, URL 암호화 |
| WebhookDispatchService | PrismaService, CryptoService, HttpService | 발송 로직 |
| MonitoringAlertService | WebhookDispatchService | 외부 알림 트리거 |

---

## 3. Data Model

### 3.1 Prisma Schema

#### WebhookType Enum

```prisma
enum WebhookType {
    SLACK
    GENERIC

    @@schema("public")
}
```

#### WebhookChannel Model

```prisma
model WebhookChannel {
    id        Int         @id @default(autoincrement())
    userId    Int         @map("user_id")
    user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
    name      String      @map("name") @db.VarChar(50)
    type      WebhookType @map("type")
    url       String      @map("url") @db.VarChar(1000)  // AES-256 암호화 저장
    isActive  Boolean     @default(true) @map("is_active")

    createdAt DateTime  @default(now()) @map("created_at")
    createdBy Int?      @map("created_by")
    updatedAt DateTime? @map("updated_at")
    updatedBy Int?      @map("updated_by")
    isDeleted Boolean?  @default(false) @map("is_deleted")
    deletedAt DateTime? @map("deleted_at")
    deletedBy Int?      @map("deleted_by")

    webhookLogs WebhookLog[]

    @@index([userId, isDeleted])
    @@map("webhook_channel")
    @@schema("public")
}
```

#### WebhookLog Model

```prisma
model WebhookLog {
    id           Int            @id @default(autoincrement())
    channelId    Int            @map("channel_id")
    channel      WebhookChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
    endpointId   Int            @map("endpoint_id")
    alertType    String         @map("alert_type") @db.VarChar(10)
    statusCode   Int?           @map("status_code")
    isSuccess    Boolean        @map("is_success")
    retryCount   Int            @default(0) @map("retry_count")
    errorMessage String?        @map("error_message") @db.VarChar(500)

    createdAt DateTime @default(now()) @map("created_at")

    @@index([channelId, createdAt])
    @@map("webhook_log")
    @@schema("public")
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [WebhookChannel] 1 ──── N [WebhookLog]
  │
  └── 1 ──── N [ApiEndpoint] (기존)
```

### 3.3 User Model 수정

```prisma
// user.prisma에 relation 추가
model User {
    // ... 기존 필드
    webhookChannels  WebhookChannel[]  // 신규
}
```

---

## 4. API Specification

### 4.1 User App API

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| POST | `/api/v1/webhook/channels` | Webhook 채널 등록 | Required | FR-01 |
| GET | `/api/v1/webhook/channels` | 내 채널 목록 조회 | Required | FR-03 |
| GET | `/api/v1/webhook/channels/:id` | 채널 상세 조회 | Required | FR-03 |
| PATCH | `/api/v1/webhook/channels/:id` | 채널 수정 | Required | FR-02 |
| DELETE | `/api/v1/webhook/channels/:id` | 채널 삭제 (soft) | Required | FR-02 |
| POST | `/api/v1/webhook/channels/:id/test` | 테스트 발송 | Required | FR-10 |
| GET | `/api/v1/webhook/channels/:id/logs` | 발송 이력 조회 | Required | FR-08 |

### 4.2 Admin App API

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| GET | `/admin/v1/webhook/channels` | 전체 채널 현황 조회 | Required | FR-11 |
| GET | `/admin/v1/webhook/channels/:id/logs` | 채널별 발송 이력 | Required | FR-11 |

### 4.3 Detailed Specification

#### `POST /api/v1/webhook/channels`

**Request:**
```json
{
    "name": "팀 슬랙 알림",
    "type": "SLACK",
    "url": "https://hooks.slack.com/services/T00/B00/xxx"
}
```

**Response (201 Created):**
```json
{
    "id": 1,
    "name": "팀 슬랙 알림",
    "type": "SLACK",
    "url": "https://hooks.slack.com/services/T00/B00/***",
    "isActive": true,
    "createdAt": "2026-03-20T12:00:00Z"
}
```

**Validation:**
- `name`: 1~50자, 필수
- `type`: `SLACK` | `GENERIC`, 필수
- `url`: URL 형식, 필수. SLACK인 경우 `https://hooks.slack.com/` 프리픽스 검증
- 사용자별 최대 5개 제한 (FR-09)

**Error Responses:**
- `400 WEBHOOK_ERROR_001`: URL 형식 오류
- `400 WEBHOOK_ERROR_002`: 채널 수 제한 초과 (5개)
- `400 WEBHOOK_ERROR_003`: 중복 URL

#### `PATCH /api/v1/webhook/channels/:id`

**Request:**
```json
{
    "name": "변경된 이름",
    "isActive": false
}
```

**Response (200 OK):** 수정된 채널 정보

**Validation:**
- 본인 소유 채널만 수정 가능 (userId 검증)
- `url` 변경 시 재암호화

#### `POST /api/v1/webhook/channels/:id/test`

**Request:** 없음

**Response (200 OK):**
```json
{
    "success": true,
    "statusCode": 200,
    "message": "테스트 발송 성공"
}
```

**동작:**
- 테스트 메시지를 해당 채널로 즉시 발송
- Redis 쿨다운 적용하지 않음 (테스트는 제외)
- WebhookLog에 alertType: `TEST`로 기록

#### `GET /api/v1/webhook/channels/:id/logs`

**Query Parameters:**
- `page`: 페이지 번호 (기본: 1)
- `limit`: 페이지 크기 (기본: 20, 최대: 100)

**Response (200 OK):**
```json
{
    "data": [
        {
            "id": 1,
            "alertType": "DOWN",
            "statusCode": 200,
            "isSuccess": true,
            "retryCount": 0,
            "createdAt": "2026-03-20T12:00:00Z"
        }
    ],
    "meta": {
        "total": 50,
        "page": 1,
        "limit": 20,
        "totalPages": 3
    }
}
```

---

## 5. Core Service Design

### 5.1 WebhookDispatchService

```typescript
// libs/common/src/webhook/webhook-dispatch.service.ts
@Injectable()
export class WebhookDispatchService {
    private readonly MAX_RETRY = 3
    private readonly RETRY_DELAYS = [1000, 5000, 15000]

    constructor(
        private readonly prisma: PrismaService,
        private readonly crypto: CryptoService,
        private readonly httpService: HttpService
    ) {}

    /**
     * 사용자의 모든 활성 Webhook 채널로 알림을 비동기 발송
     * MonitoringAlertService에서 호출 (fire-and-forget)
     */
    async dispatchAll(userId: number, endpointId: number, type: 'DOWN' | 'UP' | 'SLOW', endpointName: string): Promise<void> {
        // 1. 활성 채널 조회
        // 2. 각 채널별 비동기 발송 (Promise.allSettled)
        // 3. 로그 저장
    }

    /**
     * 단일 채널에 알림 발송 (재시도 포함)
     */
    private async dispatchToChannel(channel: WebhookChannel, payload: object): Promise<WebhookLogData> {
        // 1. URL 복호화
        // 2. HTTP POST (timeout: 10초)
        // 3. 실패 시 재시도 (1s → 5s → 15s)
        // 4. 결과 반환
    }

    /**
     * 테스트 발송 (단일 채널, 재시도 없음)
     */
    async dispatchTest(channelId: number, userId: number): Promise<TestResult> {
        // 1. 채널 조회 + 소유자 검증
        // 2. 테스트 payload 생성
        // 3. 발송 + 로그 저장 (alertType: TEST)
    }
}
```

### 5.2 WebhookPayloadBuilder

```typescript
// libs/common/src/webhook/webhook-payload.builder.ts
export class WebhookPayloadBuilder {
    /**
     * Slack Block Kit 포맷 메시지 생성
     */
    static buildSlackPayload(type: string, endpointName: string, details?: object): SlackPayload {
        // Block Kit 구조:
        // - Header: 상태 아이콘 + 타이틀
        // - Section: 엔드포인트명, 상태, 시간
        // - Color: DOWN=danger(#E01E5A), UP=good(#2EB67D), SLOW=warning(#ECB22E)
    }

    /**
     * Generic JSON 페이로드 생성
     */
    static buildGenericPayload(type: string, endpointName: string, endpointId: number, details?: object): GenericPayload {
        // { event, endpoint, status, timestamp, details }
    }

    /**
     * 테스트 메시지 페이로드
     */
    static buildTestPayload(channelType: WebhookType): SlackPayload | GenericPayload {
        // 테스트 전용 메시지
    }
}
```

### 5.3 Slack Block Kit 메시지 구조

```json
{
    "attachments": [
        {
            "color": "#E01E5A",
            "blocks": [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "🔴 서비스 다운 감지",
                        "emoji": true
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        { "type": "mrkdwn", "text": "*엔드포인트:*\nMy API Server" },
                        { "type": "mrkdwn", "text": "*상태:*\nDOWN" },
                        { "type": "mrkdwn", "text": "*감지 시간:*\n2026-03-20 12:00:00 KST" }
                    ]
                }
            ]
        }
    ]
}
```

### 5.4 Generic Webhook JSON 페이로드

```json
{
    "event": "endpoint.down",
    "timestamp": "2026-03-20T03:00:00.000Z",
    "endpoint": {
        "id": 1,
        "name": "My API Server"
    },
    "alert": {
        "type": "DOWN",
        "message": "My API Server 엔드포인트가 연속 실패하여 장애 상태로 전환되었습니다."
    }
}
```

---

## 6. MonitoringAlertService 수정

```typescript
// libs/common/src/monitoring/monitoring-alert.service.ts (수정)
@Injectable()
export class MonitoringAlertService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        private readonly webhookDispatch: WebhookDispatchService  // 신규 주입
    ) {}

    async sendAlert(endpointId: number, userId: number, type: 'DOWN' | 'UP' | 'SLOW', endpointName: string): Promise<void> {
        // ... 기존 Redis 쿨다운 체크 (변경 없음)
        // ... 기존 Notification 생성 (변경 없음)
        // ... 기존 Redis setex (변경 없음)

        // 신규: 외부 Webhook 발송 (fire-and-forget, await 없음)
        this.webhookDispatch.dispatchAll(userId, endpointId, type, endpointName)
            .catch(err => this.logger.error(`Webhook 발송 실패: ${err.message}`))
    }
}
```

**핵심**: `await` 없이 호출하여 스케줄러 블로킹 방지. 에러는 catch로 로깅만 처리.

---

## 7. Error Handling

### 7.1 Error Code Definition

```typescript
// exception.code.ts에 추가
export type WebhookErrorType = 'NOT_FOUND' | 'INVALID_URL' | 'CHANNEL_LIMIT_EXCEEDED' | 'DUPLICATE_URL' | 'DISPATCH_FAILED' | 'FORBIDDEN'

export const WEBHOOK_ERROR: { [key in WebhookErrorType]: ExceptionCodeData } = {
    NOT_FOUND:              { status: 404, code: 'WEBHOOK_ERROR_001', message: 'Webhook 채널을 찾을 수 없습니다.' },
    INVALID_URL:            { status: 400, code: 'WEBHOOK_ERROR_002', message: '올바르지 않은 Webhook URL입니다.' },
    CHANNEL_LIMIT_EXCEEDED: { status: 400, code: 'WEBHOOK_ERROR_003', message: 'Webhook 채널 수 제한(5개)을 초과했습니다.' },
    DUPLICATE_URL:          { status: 400, code: 'WEBHOOK_ERROR_004', message: '이미 등록된 Webhook URL입니다.' },
    DISPATCH_FAILED:        { status: 500, code: 'WEBHOOK_ERROR_005', message: 'Webhook 발송에 실패했습니다.' },
    FORBIDDEN:              { status: 403, code: 'WEBHOOK_ERROR_006', message: '해당 Webhook 채널에 접근할 수 없습니다.' }
}
```

---

## 8. Security Considerations

- [x] **URL 암호화**: CryptoService.encrypt()로 AES-256 암호화 저장
- [x] **URL 마스킹**: API 응답에서 URL 뒤 절반을 `***`로 마스킹
- [x] **소유자 검증**: 모든 CRUD에서 userId 검증 (JWT 페이로드)
- [x] **Slack URL 검증**: `https://hooks.slack.com/services/` 프리픽스 필수
- [x] **Generic URL 검증**: HTTPS 프로토콜만 허용
- [x] **Rate Limiting**: 기존 Throttler 모듈 적용

---

## 9. DTO Specification

### 9.1 Request DTOs

```typescript
// dto/create-webhook-channel.dto.ts
export class CreateWebhookChannelDto {
    @IsString() @Length(1, 50)
    name: string

    @IsEnum(WebhookType)
    type: WebhookType

    @IsUrl({ protocols: ['https'], require_protocol: true })
    url: string
}

// dto/update-webhook-channel.dto.ts
export class UpdateWebhookChannelDto {
    @IsOptional() @IsString() @Length(1, 50)
    name?: string

    @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true })
    url?: string

    @IsOptional() @IsBoolean()
    isActive?: boolean
}

// dto/webhook-log-query.dto.ts
export class WebhookLogQueryDto extends OffsetPaginationRequestDto {
    // 상속으로 page, limit 포함
}
```

### 9.2 Response DTOs

```typescript
// dto/webhook-channel-response.dto.ts
export class WebhookChannelResponseDto {
    id: number
    name: string
    type: WebhookType
    url: string          // 마스킹된 URL
    isActive: boolean
    createdAt: Date
}

// dto/webhook-log-response.dto.ts
export class WebhookLogResponseDto {
    id: number
    alertType: string
    statusCode: number | null
    isSuccess: boolean
    retryCount: number
    errorMessage: string | null
    createdAt: Date
}

// dto/webhook-test-response.dto.ts
export class WebhookTestResponseDto {
    success: boolean
    statusCode: number | null
    message: string
}
```

---

## 10. File Structure

### 10.1 신규 파일

```
libs/common/src/webhook/
├── webhook-common.module.ts          # 공통 모듈 (WebhookDispatchService 제공)
├── webhook-dispatch.service.ts       # 발송 + 재시도 로직
├── webhook-payload.builder.ts        # Slack/Generic 페이로드 생성
└── index.ts                          # barrel export

apps/user/src/webhook/
├── webhook.module.ts
├── webhook.controller.ts             # 7개 엔드포인트
├── webhook.service.ts                # 비즈니스 로직
├── webhook.repository.ts             # Prisma 쿼리
└── dto/
    ├── create-webhook-channel.dto.ts
    ├── update-webhook-channel.dto.ts
    ├── webhook-channel-response.dto.ts
    ├── webhook-log-query.dto.ts
    ├── webhook-log-response.dto.ts
    └── webhook-test-response.dto.ts

apps/admin/src/webhook/
├── webhook.module.ts
├── webhook.controller.ts             # 2개 엔드포인트
├── webhook.service.ts
└── webhook.repository.ts

libs/prisma/src/configs/models/
└── webhook.prisma                    # WebhookChannel, WebhookLog 모델
```

### 10.2 수정 파일

```
libs/common/src/monitoring/monitoring-alert.service.ts  # WebhookDispatchService 주입
libs/common/src/monitoring/monitoring-common.module.ts  # WebhookCommonModule import
libs/common/src/exception/exception.code.ts             # WEBHOOK_ERROR 추가
libs/common/src/exception/exception.type.ts             # WebhookErrorType 추가
libs/common/src/index.ts                                # webhook export 추가
libs/prisma/src/configs/models/enum.prisma              # WebhookType enum 추가
libs/prisma/src/configs/models/user.prisma              # webhookChannels relation 추가
apps/user/src/app.module.ts                             # WebhookModule import
apps/admin/src/app.module.ts                            # AdminWebhookModule import
```

---

## 11. Implementation Order

1. [ ] **Prisma Schema** — `webhook.prisma` 생성, `enum.prisma`에 WebhookType 추가, `user.prisma`에 relation 추가, 마이그레이션 실행
2. [ ] **Exception 정의** — `exception.code.ts`, `exception.type.ts`에 WEBHOOK_ERROR 추가
3. [ ] **공통 모듈** — `libs/common/src/webhook/` 생성 (WebhookDispatchService, PayloadBuilder, Module)
4. [ ] **exports 업데이트** — `libs/common/src/index.ts`에 webhook export 추가
5. [ ] **User App DTOs** — `apps/user/src/webhook/dto/` 생성
6. [ ] **User App Module** — Repository → Service → Controller → Module 순서로 구현
7. [ ] **MonitoringAlertService 통합** — WebhookDispatchService 주입 및 호출 추가
8. [ ] **Admin App Module** — Repository → Service → Controller → Module 순서로 구현
9. [ ] **App Module 등록** — User/Admin app.module.ts에 WebhookModule import

---

## 12. Test Plan

### 12.1 Test Cases

- [ ] Webhook 채널 생성 성공 (SLACK / GENERIC)
- [ ] 채널 수 제한 (5개) 초과 시 에러
- [ ] 잘못된 URL 형식 시 validation 에러
- [ ] Slack URL이 아닌 URL로 SLACK 타입 생성 시 에러
- [ ] 본인 소유 아닌 채널 수정/삭제 시 403
- [ ] 테스트 발송 성공/실패
- [ ] 상태 변경 시 Webhook 발송 (DOWN/UP/SLOW)
- [ ] 발송 실패 시 재시도 3회
- [ ] WebhookLog 기록 확인
- [ ] URL 암호화/복호화 정상 동작
- [ ] API 응답에서 URL 마스킹 확인

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | 초안 작성 | Claude |
