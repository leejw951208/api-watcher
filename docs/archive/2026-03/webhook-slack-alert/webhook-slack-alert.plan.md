# Webhook/Slack 알림 연동 Planning Document

> **Summary**: 모니터링 상태 변경 시 Webhook/Slack으로 실시간 외부 알림을 발송하는 기능
>
> **Project**: api-watcher
> **Author**: Claude
> **Date**: 2026-03-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 모니터링 알림이 DB(Notification 테이블)에만 저장되어, 사용자가 앱에 접속하지 않으면 장애를 인지할 수 없음 |
| **Solution** | Webhook URL/Slack Incoming Webhook을 등록하면 상태 변경(DOWN/UP/SLOW) 시 자동으로 외부 알림을 발송하는 시스템 구축 |
| **Function/UX Effect** | 사용자는 Slack 채널이나 자체 시스템에서 즉시 장애/복구/지연 알림을 수신하여 대응 시간 단축 |
| **Core Value** | 모니터링 서비스의 핵심 가치인 "실시간 인지"를 완성하여, 서비스 신뢰도와 사용자 만족도 향상 |

---

## 1. Overview

### 1.1 Purpose

모니터링 상태 변경(DOWN, UP, SLOW) 이벤트 발생 시, 기존 DB 알림 외에 사용자가 설정한 Webhook URL 또는 Slack Incoming Webhook으로 실시간 알림을 발송한다.

### 1.2 Background

- 현재 `MonitoringAlertService.sendAlert()`는 `Notification` 테이블에만 레코드를 생성
- 사용자가 앱에 접속해야만 알림을 확인할 수 있어, 실시간 장애 대응이 불가능
- 경쟁 서비스(UptimeRobot, Better Uptime 등)는 Slack/Discord/Webhook 알림을 기본 제공
- Redis 기반 중복 방지(5분 쿨다운)가 이미 구현되어 있어 외부 알림에도 동일하게 적용 가능

### 1.3 Related Documents

- 아카이브: `docs/archive/2026-03/saas-api-monitoring/saas-api-monitoring.design.md`
- 현재 알림 서비스: `libs/common/src/monitoring/monitoring-alert.service.ts`

---

## 2. Scope

### 2.1 In Scope

- [ ] Webhook 채널 CRUD API (User 앱)
- [ ] Slack Incoming Webhook 지원
- [ ] Generic Webhook (커스텀 URL) 지원
- [ ] 상태 변경 시 Webhook 발송 (MonitoringAlertService 확장)
- [ ] 발송 실패 시 재시도 로직 (최대 3회)
- [ ] Webhook 발송 이력 저장
- [ ] Admin 앱에서 전체 Webhook 현황 조회
- [ ] 사용자별 Webhook 채널 수 제한 (최대 5개)

### 2.2 Out of Scope

- 이메일 알림 (별도 피처로 분리)
- Discord/Telegram 등 추가 채널 (향후 확장)
- Webhook 수신 (Inbound Webhook)
- 알림 규칙 커스터마이징 (임계값 등은 별도 피처)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 사용자가 Webhook 채널(Slack/Generic)을 등록할 수 있다 | High | Pending |
| FR-02 | 사용자가 Webhook 채널을 수정/삭제할 수 있다 | High | Pending |
| FR-03 | 사용자가 자신의 Webhook 채널 목록을 조회할 수 있다 | High | Pending |
| FR-04 | 모니터링 상태 변경(DOWN/UP/SLOW) 시 등록된 Webhook으로 알림을 발송한다 | High | Pending |
| FR-05 | Slack Webhook은 Block Kit 포맷으로 메시지를 구성한다 | Medium | Pending |
| FR-06 | Generic Webhook은 JSON payload로 POST 요청을 보낸다 | High | Pending |
| FR-07 | 발송 실패 시 최대 3회 재시도한다 (1초, 5초, 15초 간격) | Medium | Pending |
| FR-08 | Webhook 발송 이력(성공/실패)을 저장한다 | Medium | Pending |
| FR-09 | 사용자별 Webhook 채널 수를 5개로 제한한다 | Low | Pending |
| FR-10 | Webhook 채널 등록 시 테스트 발송 API를 제공한다 | Medium | Pending |
| FR-11 | Admin이 전체 Webhook 현황을 조회할 수 있다 | Low | Pending |
| FR-12 | 기존 Redis 쿨다운(5분)이 외부 알림에도 동일하게 적용된다 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | Webhook 발송이 모니터링 스케줄러를 블로킹하지 않을 것 | 비동기 발송, 스케줄러 사이클 시간 측정 |
| Reliability | 발송 실패율 5% 미만 (네트워크 장애 제외) | Webhook 발송 이력 통계 |
| Security | Webhook URL은 암호화하여 저장 | AES-256 암호화 적용 |
| Scalability | 동시 100개 Webhook 발송 처리 | 부하 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Webhook 채널 CRUD API 구현 및 Swagger 문서화
- [ ] Slack Block Kit 메시지 포맷 구현
- [ ] Generic Webhook JSON payload 구현
- [ ] MonitoringAlertService에서 외부 알림 발송 통합
- [ ] 재시도 로직 구현
- [ ] 발송 이력 저장
- [ ] 코드 리뷰 완료

### 4.2 Quality Criteria

- [ ] 린트 에러 0건
- [ ] 빌드 성공
- [ ] 기존 모니터링 기능 영향 없음 (회귀 테스트)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Webhook 발송이 스케줄러 성능에 영향 | High | Medium | 비동기(fire-and-forget) 발송, 별도 큐 사용 검토 |
| 사용자가 잘못된 URL 등록 | Medium | High | 등록 시 테스트 발송으로 검증, URL 형식 validation |
| Slack API 변경/장애 | Medium | Low | Slack API 의존을 Incoming Webhook으로 한정 (OAuth 불필요) |
| Webhook URL 유출 시 보안 이슈 | High | Low | URL 암호화 저장, API 응답에서 마스킹 |
| 대량 알림 발생 시 외부 서비스 rate limit | Medium | Medium | 기존 Redis 쿨다운 활용, 배치 발송 검토 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS | Web apps, SaaS MVPs | **V** |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Webhook 발송 방식 | 동기 / 비동기(fire-and-forget) / Bull Queue | 비동기(fire-and-forget) | 스케줄러 블로킹 방지, Bull Queue는 과도한 복잡성 |
| HTTP Client | axios / fetch / got | axios | 프로젝트에서 이미 사용 중, 재시도 인터셉터 구현 용이 |
| Slack 연동 방식 | OAuth Bot / Incoming Webhook | Incoming Webhook | 권한 관리 불필요, 사용자가 직접 URL 발급 |
| URL 암호화 | AES-256 / 평문 저장 | AES-256 | Webhook URL은 민감 정보, CryptoService 재활용 |
| DB 설계 | Notification 확장 / 별도 테이블 | 별도 테이블(WebhookChannel, WebhookLog) | 관심사 분리, Notification은 인앱 알림 전용 |

### 6.3 통합 아키텍처

```
MonitoringSchedulerService
  └→ 상태 변경 감지
       └→ MonitoringAlertService.sendAlert()
            ├→ DB Notification 생성 (기존)
            └→ WebhookDispatchService.dispatch() (신규)
                 ├→ Slack Webhook → Block Kit JSON
                 └→ Generic Webhook → Standard JSON
                      └→ WebhookLog 기록
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration (`.eslintrc.js`)
- [x] Prettier configuration (`.prettierrc`)
- [x] TypeScript configuration (`tsconfig.json`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | exists | WebhookChannel, WebhookLog 모델명 | High |
| **Folder structure** | exists | `libs/common/src/webhook/` 경로 | High |
| **Error handling** | exists | WEBHOOK 관련 예외 코드 추가 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `WEBHOOK_ENCRYPT_KEY` | Webhook URL AES-256 암호화 키 | Server | **V** |
| `WEBHOOK_MAX_RETRY` | 최대 재시도 횟수 (기본값: 3) | Server | Optional |
| `WEBHOOK_RETRY_DELAYS` | 재시도 간격 ms (기본값: 1000,5000,15000) | Server | Optional |

---

## 8. Data Model Preview

### 8.1 WebhookChannel

```prisma
model WebhookChannel {
    id         Int            @id @default(autoincrement())
    userId     Int            @map("user_id")
    user       User           @relation(fields: [userId], references: [id], onDelete: Cascade)
    name       String         @map("name") @db.VarChar(50)
    type       WebhookType    @map("type")           // SLACK | GENERIC
    url        String         @map("url") @db.VarChar(500)  // 암호화 저장
    isActive   Boolean        @default(true) @map("is_active")

    createdAt  DateTime       @default(now()) @map("created_at")
    updatedAt  DateTime?      @map("updated_at")
    isDeleted  Boolean?       @default(false) @map("is_deleted")
    deletedAt  DateTime?      @map("deleted_at")

    webhookLogs WebhookLog[]

    @@index([userId])
    @@map("webhook_channel")
}
```

### 8.2 WebhookLog

```prisma
model WebhookLog {
    id           Int            @id @default(autoincrement())
    channelId    Int            @map("channel_id")
    channel      WebhookChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
    endpointId   Int            @map("endpoint_id")
    alertType    String         @map("alert_type") @db.VarChar(10) // DOWN, UP, SLOW
    statusCode   Int?           @map("status_code")
    isSuccess    Boolean        @map("is_success")
    retryCount   Int            @default(0) @map("retry_count")
    errorMessage String?        @map("error_message") @db.VarChar(500)

    createdAt    DateTime       @default(now()) @map("created_at")

    @@index([channelId, createdAt])
    @@map("webhook_log")
}
```

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design webhook-slack-alert`)
2. [ ] 팀 리뷰 및 승인
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | 초안 작성 | Claude |
