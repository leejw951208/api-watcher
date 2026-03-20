# SaaS API Monitoring Design Document

> **Summary**: SaaS형 API 모니터링 서비스 상세 설계 — User/Admin 양쪽 API + 공유 스케줄러/헬스체커
>
> **Project**: api-watcher (monorepo)
> **Version**: 0.0.1
> **Author**: leejinwoo
> **Date**: 2026-03-20
> **Status**: Draft
> **Planning Doc**: [saas-api-monitoring.plan.md](../../01-plan/features/saas-api-monitoring.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- User 앱: 사용자가 자기 API를 등록/관리하고 결과를 조회 (데이터 격리)
- Admin 앱: 전체 엔드포인트/사용자 관리 + 시스템 대시보드
- 공유 모듈: 스케줄러, 헬스체커, 알림은 `@libs/common`에 배치
- 기존 프로젝트 패턴 100% 준수 (Module/Controller/Service/Repository, BaseException, CLS)

### 1.2 Design Principles

- 데이터 격리: User 앱의 모든 API는 `userId`로 소유자 검증 (기존 Post 패턴과 동일)
- 단일 책임: 스케줄러, 헬스체커, 알림은 각각 분리된 서비스
- 기존 패턴 재사용: `@CurrentUser()`, `plainToInstance()`, `OffsetResponseDto` 등

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────────────────────────────────────────┐
│                   User App (3000, /api)                    │
│  ┌──────────────────────┐   ┌──────────────────────────┐  │
│  │ EndpointController    │   │ MonitoringLogController  │  │
│  │ (자기 엔드포인트 CRUD) │   │ (자기 이력/통계/대시보드) │  │
│  └──────────┬───────────┘   └────────────┬─────────────┘  │
│             │                            │                 │
│  ┌──────────▼───────────┐   ┌────────────▼─────────────┐  │
│  │ EndpointService       │   │ MonitoringLogService     │  │
│  │ (userId 검증 포함)     │   │ (userId 검증 포함)       │  │
│  └──────────┬───────────┘   └────────────┬─────────────┘  │
│             │                            │                 │
│  ┌──────────▼───────────┐   ┌────────────▼─────────────┐  │
│  │ EndpointRepository    │   │ MonitoringLogRepository  │  │
│  └──────────────────────┘   └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                  Admin App (3001, /admin)                  │
│  ┌──────────────────────┐   ┌──────────────────────────┐  │
│  │ AdminEndpointCtrl     │   │ AdminMonitoringLogCtrl   │  │
│  │ (전체 관리)            │   │ (시스템 대시보드/통계)    │  │
│  └──────────┬───────────┘   └────────────┬─────────────┘  │
│             │                            │                 │
│  ┌──────────▼───────────┐   ┌────────────▼─────────────┐  │
│  │ AdminEndpointService  │   │ AdminMonitoringLogService│  │
│  └──────────┬───────────┘   └────────────┬─────────────┘  │
│             │                            │                 │
│  ┌──────────▼───────────┐   ┌────────────▼─────────────┐  │
│  │ AdminEndpointRepo     │   │ AdminMonitoringLogRepo   │  │
│  └──────────────────────┘   └──────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     @libs/common                          │
│  ┌────────────────────────┐  ┌─────────────────────────┐  │
│  │ MonitoringScheduler    │  │ HealthCheckerService    │  │
│  │ (@Cron 30초마다 실행)   │  │ (HTTP 요청 + 결과 판정) │  │
│  └────────────┬───────────┘  └────────────┬────────────┘  │
│               └───────────┬───────────────┘                │
│                           ▼                                │
│               ┌───────────────────────┐                    │
│               │ MonitoringAlertService │                    │
│               │ (알림 생성+Redis 중복방지)│                  │
│               └───────────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. 엔드포인트 등록 (User API)
   User → EndpointController → EndpointService (userId 자동 주입) → DB

2. 주기적 헬스체크 (Cron)
   MonitoringScheduler → 활성 엔드포인트 조회 (전체)
     → HealthCheckerService.check() (HTTP 요청)
     → MonitoringLog 저장
     → 상태 변경 판정 (UP/DOWN/SLOW)
     → Redis 상태 캐싱
     → 상태 변경 시 → MonitoringAlertService → Notification 생성 (userId 연결)

3. 이력/통계 조회 (User API)
   User → MonitoringLogController → MonitoringLogService (userId 필터) → DB

4. 전체 관리 (Admin API)
   Admin → AdminEndpointController → AdminEndpointService (userId 필터 없음) → DB
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| MonitoringScheduler | @nestjs/schedule | Cron 기반 주기적 실행 |
| HealthCheckerService | @nestjs/axios (HttpModule) | HTTP 헬스체크 요청 |
| MonitoringAlertService | Redis, PrismaService | 중복 알림 방지, Notification 생성 |
| EndpointController | EndpointService, @CurrentUser | 사용자 엔드포인트 CRUD |
| AdminEndpointController | AdminEndpointService | 전체 엔드포인트 관리 |

---

## 3. Data Model

### 3.1 Prisma Schema (`libs/prisma/src/configs/models/monitoring.prisma`)

```prisma
model ApiEndpoint {
    id                  Int            @id @default(autoincrement())
    userId              Int            @map("user_id")
    user                User           @relation(fields: [userId], references: [id], onDelete: Cascade)
    name                String         @map("name") @db.VarChar(100)
    url                 String         @map("url") @db.VarChar(500)
    method              HttpMethod     @default(GET) @map("method")
    headers             Json?          @map("headers")
    body                Json?          @map("body")
    expectedStatus      Int            @default(200) @map("expected_status")
    timeout             Int            @default(10000) @map("timeout")
    interval            CheckInterval  @default(MIN_1) @map("interval")
    status              EndpointStatus @default(UP) @map("status")
    failureThreshold    Int            @default(3) @map("failure_threshold")
    consecutiveFailures Int            @default(0) @map("consecutive_failures")
    lastCheckedAt       DateTime?      @map("last_checked_at")
    isPaused            Boolean        @default(false) @map("is_paused")

    createdAt DateTime  @default(now()) @map("created_at")
    createdBy Int?      @map("created_by")
    updatedAt DateTime? @map("updated_at")
    updatedBy Int?      @map("updated_by")
    isDeleted Boolean?  @default(false) @map("is_deleted")
    deletedAt DateTime? @map("deleted_at")
    deletedBy Int?      @map("deleted_by")

    monitoringLogs MonitoringLog[]

    @@index([userId])
    @@map("api_endpoint")
    @@schema("public")
}

model MonitoringLog {
    id           Int         @id @default(autoincrement())
    endpointId   Int         @map("endpoint_id")
    endpoint     ApiEndpoint @relation(fields: [endpointId], references: [id], onDelete: Cascade)
    statusCode   Int?        @map("status_code")
    responseTime Int?        @map("response_time")
    isSuccess    Boolean     @map("is_success")
    errorMessage String?     @map("error_message") @db.VarChar(500)

    createdAt DateTime @default(now()) @map("created_at")

    @@index([endpointId, createdAt])
    @@map("monitoring_log")
    @@schema("public")
}
```

### 3.2 Enum 추가 (`libs/prisma/src/configs/models/enum.prisma`)

```prisma
enum EndpointStatus {
    UP / DOWN / SLOW / PAUSED
    @@schema("public")
}

enum HttpMethod {
    GET / POST / HEAD
    @@schema("public")
}

enum CheckInterval {
    SEC_30 / MIN_1 / MIN_3 / MIN_5
    @@schema("public")
}

NotificationType에 MONITORING 추가
```

### 3.3 User 모델 수정 (`user.prisma`)

```prisma
// User 모델에 relation 추가
apiEndpoints  ApiEndpoint[]
```

### 3.4 Entity Relationships

```
[User] 1 ──── N [ApiEndpoint] 1 ──── N [MonitoringLog]
  │
  └── 1 ──── N [Notification] (type: MONITORING)
```

---

## 4. API Specification

### 4.1 User 앱 API (`/api/v1/monitoring`)

#### 엔드포인트 관리

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| POST | `/api/v1/monitoring/endpoints` | 엔드포인트 등록 (자기 것) | User JWT | FR-01 |
| GET | `/api/v1/monitoring/endpoints` | 엔드포인트 목록 조회 (자기 것만) | User JWT | FR-03 |
| GET | `/api/v1/monitoring/endpoints/:id` | 엔드포인트 상세 조회 (자기 것만) | User JWT | FR-04 |
| PATCH | `/api/v1/monitoring/endpoints/:id` | 엔드포인트 수정 (자기 것만) | User JWT | FR-02 |
| DELETE | `/api/v1/monitoring/endpoints/:id` | 엔드포인트 삭제 (자기 것만) | User JWT | FR-02 |
| PATCH | `/api/v1/monitoring/endpoints/:id/pause` | 모니터링 일시정지 | User JWT | FR-08 |
| PATCH | `/api/v1/monitoring/endpoints/:id/resume` | 모니터링 재개 | User JWT | FR-08 |

#### 이력/통계/대시보드

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| GET | `/api/v1/monitoring/logs/:endpointId` | 특정 엔드포인트 이력 (자기 것만) | User JWT | FR-05 |
| GET | `/api/v1/monitoring/stats/:endpointId` | 가용률 통계 (자기 것만) | User JWT | FR-06 |
| GET | `/api/v1/monitoring/dashboard` | 개인 대시보드 (자기 것 요약) | User JWT | FR-07 |

### 4.2 Admin 앱 API (`/admin/v1/monitoring`)

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| GET | `/admin/v1/monitoring/endpoints` | 전체 엔드포인트 목록 (사용자 정보 포함) | Admin JWT | FR-10 |
| GET | `/admin/v1/monitoring/endpoints/:id` | 엔드포인트 상세 | Admin JWT | FR-10 |
| PATCH | `/admin/v1/monitoring/endpoints/:id/pause` | 강제 일시정지 | Admin JWT | FR-11 |
| DELETE | `/admin/v1/monitoring/endpoints/:id` | 강제 삭제 | Admin JWT | FR-11 |
| GET | `/admin/v1/monitoring/dashboard` | 시스템 대시보드 | Admin JWT | FR-12 |
| GET | `/admin/v1/monitoring/logs` | 전체 이력 조회 | Admin JWT | FR-12 |

### 4.3 User API 상세

#### `POST /api/v1/monitoring/endpoints`

**Request:**
```json
{
    "name": "My API Health",
    "url": "https://api.example.com/health",
    "method": "GET",
    "headers": { "Authorization": "Bearer xxx" },
    "expectedStatus": 200,
    "timeout": 10000,
    "interval": "MIN_1",
    "failureThreshold": 3
}
```

**Response (201 Created):**
```json
{
    "id": 1
}
```

#### `GET /api/v1/monitoring/endpoints` (자기 것만)

**Response (200 OK):**
```json
{
    "data": [...],
    "meta": { "page": 1, "totalCount": 5 }
}
```

#### `GET /api/v1/monitoring/dashboard` (개인 대시보드)

**Response (200 OK):**
```json
{
    "totalEndpoints": 5,
    "statusSummary": { "UP": 3, "DOWN": 1, "SLOW": 0, "PAUSED": 1 },
    "recentIncidents": [
        {
            "endpointId": 3,
            "name": "Payment API",
            "status": "DOWN",
            "since": "2026-03-20T09:30:00Z"
        }
    ]
}
```

#### `GET /api/v1/monitoring/stats/:endpointId?period=7d`

**Response (200 OK):**
```json
{
    "endpointId": 1,
    "period": "7d",
    "totalChecks": 10080,
    "successCount": 10050,
    "failureCount": 30,
    "uptimePercent": 99.70,
    "avgResponseTime": 145,
    "maxResponseTime": 890,
    "minResponseTime": 50
}
```

---

## 5. Error Handling

### 5.1 Error Code Definition

`exception.type.ts`에 추가:

```typescript
export type MonitoringErrorType =
    | 'NOT_FOUND'
    | 'DUPLICATE_URL'
    | 'INVALID_URL'
    | 'CHECK_FAILED'
    | 'ENDPOINT_LIMIT_EXCEEDED'
    | 'FORBIDDEN'
```

`exception.code.ts`에 추가:

```typescript
export const MONITORING_ERROR = {
    NOT_FOUND:               { status: 404, code: 'MONITORING_ERROR_001', message: '모니터링 엔드포인트를 찾을 수 없습니다.' },
    DUPLICATE_URL:           { status: 400, code: 'MONITORING_ERROR_002', message: '이미 등록된 URL입니다.' },
    INVALID_URL:             { status: 400, code: 'MONITORING_ERROR_003', message: '유효하지 않은 URL 형식입니다.' },
    CHECK_FAILED:            { status: 500, code: 'MONITORING_ERROR_004', message: '헬스체크 실행 중 오류가 발생했습니다.' },
    ENDPOINT_LIMIT_EXCEEDED: { status: 400, code: 'MONITORING_ERROR_005', message: '엔드포인트 등록 제한을 초과했습니다.' },
    FORBIDDEN:               { status: 403, code: 'MONITORING_ERROR_006', message: '해당 엔드포인트에 접근 권한이 없습니다.' }
}
```

---

## 6. Core Service Logic

### 6.1 HealthCheckerService (`libs/common`)

```typescript
// HTTP 요청 발송 + 응답시간 측정 + 성공/실패 판정
async check(endpoint: ApiEndpoint): Promise<HealthCheckResult>
```

### 6.2 MonitoringSchedulerService (`libs/common`)

```typescript
@Cron(CronExpression.EVERY_30_SECONDS)
async handleCron(): Promise<void>
// 1. 활성(isPaused=false, isDeleted=false) 엔드포인트 전체 조회
// 2. interval + lastCheckedAt 비교하여 체크 대상 필터링
// 3. 동시 실행 수 제한 (MAX_CONCURRENT=10)
// 4. HealthChecker.check() → MonitoringLog 저장 → 상태 변경 + 알림
```

### 6.3 상태 변경 로직

```
성공 시:
  - consecutiveFailures = 0
  - 응답시간 > 5000ms → SLOW + 경고 알림 (FR-17)
  - DOWN/SLOW → UP 복구 시 → 복구 알림 (FR-16)

실패 시:
  - consecutiveFailures += 1
  - >= failureThreshold → DOWN + 장애 알림 (FR-15)
```

### 6.4 MonitoringAlertService (`libs/common`)

```typescript
// Redis 중복 방지 (키: monitoring:alert:{endpointId}:{type}, TTL 5분)
// Notification 생성 시 userId 연결 (엔드포인트 소유자에게 알림)
async sendAlert(endpointId: number, userId: number, type: 'DOWN'|'UP'|'SLOW', endpointName: string)
```

### 6.5 User 앱 데이터 격리 패턴

```typescript
// 기존 PostService 패턴과 동일
async getEndpoint(userId: number, endpointId: number): Promise<EndpointResponseDto> {
    const endpoint = await this.repository.findByIdAndUserId(endpointId, userId)
    if (!endpoint) throw new BaseException(MONITORING_ERROR.NOT_FOUND, ...)
    return plainToInstance(EndpointResponseDto, endpoint, { excludeExtraneousValues: true })
}

// 등록 시 제한 체크
async createEndpoint(userId: number, dto: CreateEndpointDto): Promise<CreateResponseDto> {
    const count = await this.repository.countByUserId(userId)
    if (count >= MAX_ENDPOINTS_PER_USER) throw new BaseException(MONITORING_ERROR.ENDPOINT_LIMIT_EXCEEDED, ...)
    // ...
}
```

---

## 7. File Structure

### 7.1 User 앱 (`apps/user/src/monitoring/`)

```
apps/user/src/monitoring/
├── monitoring.module.ts
├── endpoint.controller.ts          # 엔드포인트 CRUD
├── endpoint.service.ts             # 비즈니스 로직 (userId 검증)
├── endpoint.repository.ts          # DB 접근 (userId 필터)
├── monitoring-log.controller.ts    # 이력/통계/대시보드
├── monitoring-log.service.ts
├── monitoring-log.repository.ts
└── dto/
    ├── create-endpoint.dto.ts
    ├── update-endpoint.dto.ts
    ├── endpoint-response.dto.ts
    ├── endpoint-pagination-request.dto.ts
    └── query-log.dto.ts
```

### 7.2 Admin 앱 (`apps/admin/src/monitoring/`)

```
apps/admin/src/monitoring/
├── monitoring.module.ts
├── admin-endpoint.controller.ts     # 전체 엔드포인트 관리
├── admin-endpoint.service.ts
├── admin-endpoint.repository.ts
├── admin-monitoring-log.controller.ts  # 시스템 대시보드/이력
├── admin-monitoring-log.service.ts
├── admin-monitoring-log.repository.ts
└── dto/
    ├── admin-endpoint-response.dto.ts   # 사용자 정보 포함
    └── admin-endpoint-pagination-request.dto.ts
```

### 7.3 공유 모듈 (`libs/common/src/monitoring/`)

```
libs/common/src/monitoring/
├── monitoring-common.module.ts
├── monitoring-scheduler.service.ts
├── health-checker.service.ts
├── monitoring-alert.service.ts
└── index.ts
```

### 7.4 수정 필요 파일

| File | Changes |
|------|---------|
| `apps/user/src/app.module.ts` | UserMonitoringModule import 추가 |
| `apps/admin/src/app.module.ts` | AdminMonitoringModule import 추가 |
| `libs/common/src/index.ts` | monitoring export 추가 |
| `libs/common/src/exception/exception.type.ts` | MonitoringErrorType 추가 |
| `libs/common/src/exception/exception.code.ts` | MONITORING_ERROR 추가 |
| `libs/prisma/src/configs/models/enum.prisma` | 3개 enum + NotificationType에 MONITORING |
| `libs/prisma/src/configs/models/user.prisma` | `apiEndpoints ApiEndpoint[]` relation 추가 |

---

## 8. Security Considerations

- [x] 데이터 격리: User API는 모두 userId 기반 소유자 검증
- [x] URL 입력값 검증 (유효한 URL만 허용)
- [x] JWT 인증 필수 (기존 JwtAccessGuard)
- [x] Permission Guard 적용
- [x] 사용자당 엔드포인트 등록 제한 (기본 10개)
- [x] Rate Limiting (기존 Throttler)

---

## 9. Test Plan

### 9.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | EndpointService (데이터 격리 검증) | Jest |
| Unit Test | HealthCheckerService | Jest |
| Unit Test | 상태 변경 로직 | Jest |
| Integration Test | User Monitoring API | Supertest |

### 9.2 Test Cases (Key)

- [ ] 사용자가 자기 엔드포인트만 조회/수정/삭제 가능
- [ ] 다른 사용자의 엔드포인트 접근 시 NOT_FOUND 반환
- [ ] 엔드포인트 등록 제한 초과 시 ENDPOINT_LIMIT_EXCEEDED 반환
- [ ] 헬스체크 성공 시 MonitoringLog 저장
- [ ] 연속 N회 실패 시 DOWN 전환 + Notification 생성 (소유자에게)
- [ ] DOWN → UP 복구 시 복구 알림
- [ ] 중복 URL 등록 시 (같은 사용자) 에러 반환

---

## 10. Implementation Order

1. [ ] Prisma 스키마 추가 (monitoring.prisma, enum, user.prisma relation) + 마이그레이션
2. [ ] 에러 코드 추가 (exception.type.ts, exception.code.ts)
3. [ ] HealthCheckerService 구현 (libs/common)
4. [ ] MonitoringAlertService 구현 (libs/common) — userId 연결 알림
5. [ ] MonitoringSchedulerService 구현 (libs/common)
6. [ ] **User 앱**: EndpointRepository + EndpointService (userId 격리)
7. [ ] **User 앱**: EndpointController (CRUD + pause/resume)
8. [ ] **User 앱**: MonitoringLogRepository + MonitoringLogService
9. [ ] **User 앱**: MonitoringLogController (이력/통계/대시보드)
10. [ ] **User 앱**: UserMonitoringModule + app.module.ts 등록
11. [ ] **Admin 앱**: AdminEndpointRepository + AdminEndpointService
12. [ ] **Admin 앱**: AdminEndpointController
13. [ ] **Admin 앱**: AdminMonitoringLogRepository + AdminMonitoringLogService
14. [ ] **Admin 앱**: AdminMonitoringLogController (시스템 대시보드)
15. [ ] **Admin 앱**: AdminMonitoringModule + app.module.ts 등록
16. [ ] Swagger 문서 작성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | 초안 작성 | leejinwoo |
