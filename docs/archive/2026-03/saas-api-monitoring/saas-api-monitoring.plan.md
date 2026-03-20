# SaaS API Monitoring Planning Document

> **Summary**: 사용자가 직접 API 엔드포인트를 등록하고, 주기적 헬스체크 결과를 조회할 수 있는 SaaS형 API 모니터링 서비스
>
> **Project**: api-watcher (monorepo)
> **Version**: 0.0.1
> **Author**: leejinwoo
> **Date**: 2026-03-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 개발자가 자신의 API 상태를 모니터링하려면 외부 SaaS(UptimeRobot 등)를 사용하거나 직접 인프라를 구축해야 함 |
| **Solution** | 회원가입 후 API 엔드포인트를 등록하면 자동으로 주기적 헬스체크 + 장애 알림 + 통계를 제공하는 SaaS 서비스 |
| **Function/UX Effect** | User: 자기 API 등록/관리/이력/통계 조회, Admin: 전체 사용자/엔드포인트 관리 및 시스템 모니터링 |
| **Core Value** | 별도 인프라 구축 없이 API 모니터링을 즉시 시작할 수 있는 셀프서비스형 플랫폼 |

---

## 1. Overview

### 1.1 Purpose

일반 사용자(개발자)가 회원가입 후 자신의 API 엔드포인트를 등록하고, 주기적 헬스체크 결과와 가용률 통계를 조회할 수 있는 SaaS 서비스를 구축한다. 관리자는 전체 사용자와 엔드포인트를 관리하고 시스템 전체 현황을 모니터링한다.

### 1.2 Background

- 기존 프로젝트에 User/Admin 앱이 분리된 모노레포 구조가 이미 존재
- 기존 인증(JWT), 권한(RBAC), 알림(Notification) 시스템 활용 가능
- SaaS 모델로 사용자별 데이터 격리가 핵심 요구사항

### 1.3 Related Documents

- Prisma 스키마: `libs/prisma/src/configs/models/`
- User 모델: `libs/prisma/src/configs/models/user.prisma`
- Notification 모델: `libs/prisma/src/configs/models/notification.prisma`

---

## 2. Scope

### 2.1 In Scope

- [ ] **User 앱**: 엔드포인트 CRUD (자기 것만), 이력/통계 조회, 대시보드
- [ ] **Admin 앱**: 전체 엔드포인트/사용자 관리, 시스템 대시보드
- [ ] **공유 모듈**: Cron 스케줄러, 헬스체커, 알림 서비스 (@libs/common)
- [ ] **DB 스키마**: ApiEndpoint(userId 포함), MonitoringLog
- [ ] **데이터 격리**: 사용자는 자기 엔드포인트만 접근 가능

### 2.2 Out of Scope

- 프론트엔드 대시보드 UI (API만 제공)
- 과금/플랜 시스템 (추후 확장)
- SSL 인증서 만료 모니터링
- 외부 알림 채널 (슬랙, 이메일 웹훅) — 1차에서는 DB 알림만
- 다단계 API 시나리오 테스트

---

## 3. Requirements

### 3.1 Functional Requirements

#### User 앱 (일반 사용자)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 엔드포인트 등록 (URL, 메서드, 주기, 임계값 설정) | High | Pending |
| FR-02 | 엔드포인트 수정/삭제 (자기 것만) | High | Pending |
| FR-03 | 엔드포인트 목록 조회 (자기 것만, 현재 상태 포함) | High | Pending |
| FR-04 | 엔드포인트 상세 조회 (최근 체크 결과 포함) | High | Pending |
| FR-05 | 모니터링 이력 조회 (자기 엔드포인트, 기간 필터링, 페이지네이션) | High | Pending |
| FR-06 | 가용률 통계 조회 (1일/7일/30일) | Medium | Pending |
| FR-07 | 개인 대시보드 (전체 상태 요약, 장애 엔드포인트 목록) | Medium | Pending |
| FR-08 | 모니터링 일시정지/재개 | Low | Pending |
| FR-09 | 사용자당 엔드포인트 등록 제한 (기본 10개) | Medium | Pending |

#### Admin 앱 (관리자)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-10 | 전체 엔드포인트 목록 조회 (사용자 정보 포함) | High | Pending |
| FR-11 | 특정 엔드포인트 강제 일시정지/삭제 | Medium | Pending |
| FR-12 | 시스템 대시보드 (전체 현황, 사용자별 통계) | Medium | Pending |
| FR-13 | 사용자별 엔드포인트 제한 수 변경 | Low | Pending |

#### 공유 기능

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-14 | Cron 기반 주기적 헬스체크 (30초~5분) | High | Pending |
| FR-15 | 연속 N회 실패 시 장애(DOWN) 판정 + 알림 | High | Pending |
| FR-16 | 장애 복구(UP) 감지 시 복구 알림 | Medium | Pending |
| FR-17 | 응답시간 임계값 초과 시 경고(SLOW) 알림 | Medium | Pending |
| FR-18 | 모니터링 이력 90일 보관 후 자동 정리 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 헬스체크 요청 타임아웃 10초 이내 | HTTP 클라이언트 타임아웃 설정 |
| Performance | 100개 엔드포인트 동시 모니터링 가능 | 부하 테스트 |
| Security | 사용자별 데이터 격리 (자기 엔드포인트만 접근) | API 레벨 userId 검증 |
| Reliability | 모니터링 서비스 자체 장애 시 자동 재시작 | Docker restart policy |
| Data | 모니터링 이력 90일 보관 후 자동 정리 | Cron 배치 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] User 앱: FR-01 ~ FR-08 구현 완료
- [ ] Admin 앱: FR-10 ~ FR-12 구현 완료
- [ ] 공유 모듈: FR-14 ~ FR-17 구현 완료
- [ ] 데이터 격리 검증 (다른 사용자 엔드포인트 접근 불가)
- [ ] 빌드 성공 (user + admin)
- [ ] Swagger 문서 작성 완료

### 4.2 Quality Criteria

- [ ] 테스트 커버리지 80% 이상
- [ ] Zero lint 에러
- [ ] 빌드 성공 (user + admin)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 대량 엔드포인트 모니터링 시 서버 부하 | High | Medium | 동시 요청 수 제한, 사용자당 등록 제한 |
| 사용자 데이터 격리 실패 (타인 데이터 접근) | Critical | Low | API 레벨 userId 검증 + 테스트 |
| 헬스체크 대상 서버에 DDoS로 오인 | Medium | Low | User-Agent 헤더 명시, 적절한 주기 |
| 네트워크 불안정으로 오탐 (False Positive) | Medium | High | 연속 N회 실패 후 장애 판정 |
| 모니터링 이력 데이터 급증 | Medium | Medium | 90일 보관 + 자동 정리 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps with backend | ☐ |
| **Enterprise** | Strict layer separation, DI | High-traffic systems | ☑ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | NestJS (기존) | NestJS | 기존 모노레포 구조 활용 |
| 스케줄러 | @nestjs/schedule / Bull Queue | @nestjs/schedule | 단순 Cron에 적합 |
| HTTP Client | axios / undici | axios (@nestjs/axios) | NestJS HttpModule 기본 지원 |
| 데이터 저장 | PostgreSQL (Prisma) | PostgreSQL (Prisma) | 기존 DB 인프라 활용 |
| 캐시 | Redis (기존) | Redis | 최근 상태 캐싱, 중복 알림 방지 |
| 알림 | 기존 Notification 모델 | Notification 모델 | 사용자별 알림 연동 |
| 데이터 격리 | RLS / API 레벨 | API 레벨 (userId 검증) | Prisma에서 RLS 지원 제한 |

### 6.3 앱별 역할 분리

```
┌─────────────────────────────────────────────────────┐
│ User 앱 (3000, /api)                                │
│   - 자기 엔드포인트 CRUD                              │
│   - 자기 이력/통계 조회                               │
│   - 개인 대시보드                                     │
├─────────────────────────────────────────────────────┤
│ Admin 앱 (3001, /admin)                             │
│   - 전체 엔드포인트 관리                              │
│   - 시스템 대시보드                                   │
│   - 사용자 제한 관리                                  │
├─────────────────────────────────────────────────────┤
│ @libs/common (공유)                                  │
│   - MonitoringScheduler (Cron)                      │
│   - HealthChecker (HTTP 체크)                       │
│   - MonitoringAlert (알림 + Redis 중복방지)           │
├─────────────────────────────────────────────────────┤
│ @libs/prisma (공유)                                  │
│   - ApiEndpoint (userId 포함)                       │
│   - MonitoringLog                                   │
│   - Enum (EndpointStatus, HttpMethod, CheckInterval)│
└─────────────────────────────────────────────────────┘
```

### 6.4 신규 Prisma 모델 (예상)

```
- ApiEndpoint: 모니터링 대상 (userId로 소유자 연결)
- MonitoringLog: 헬스체크 결과 이력
- (enum) EndpointStatus: UP / DOWN / SLOW / PAUSED
- (enum) HttpMethod: GET / POST / HEAD
- (enum) CheckInterval: SEC_30 / MIN_1 / MIN_3 / MIN_5
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] Prettier configuration
- [x] TypeScript configuration

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Data Isolation** | 없음 | userId 기반 접근 제어 패턴 | High |
| **Folder structure** | exists (모노레포) | User/Admin 양쪽 monitoring 모듈 | High |
| **Error handling** | exists (BaseException) | 모니터링 전용 에러 코드 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `MONITORING_DEFAULT_INTERVAL` | 기본 체크 주기 (ms) | Server | ☑ |
| `MONITORING_TIMEOUT` | HTTP 요청 타임아웃 (ms) | Server | ☑ |
| `MONITORING_MAX_CONCURRENT` | 동시 체크 최대 수 | Server | ☑ |
| `MONITORING_FAILURE_THRESHOLD` | 장애 판정 연속 실패 횟수 | Server | ☑ |
| `MONITORING_MAX_ENDPOINTS_PER_USER` | 사용자당 최대 엔드포인트 수 | Server | ☑ |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`saas-api-monitoring.design.md`)
2. [ ] Prisma 스키마 설계 (monitoring.prisma + enum 추가)
3. [ ] User 앱 모니터링 모듈 구현
4. [ ] Admin 앱 모니터링 모듈 구현
5. [ ] 공유 스케줄러/헬스체커 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | 초안 작성 | leejinwoo |
