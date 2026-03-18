# API 모니터 관리 PRD

---

## 문서 개요

| 항목 | 내용 |
|------|------|
| **문서 제목** | API 모니터 관리 기능 PRD |
| **버전** | 1.0 |
| **작성일** | 2026-03-19 |
| **작성자** | [담당자] |
| **상태** | 초안 |
| **이해관계자** | 개발팀, QA팀, 인프라팀 |

---

## 1. 배경 및 목적

### 1.1 문제 정의

운영 중인 외부 API 또는 내부 마이크로서비스가 언제 장애 상태에 빠지는지 즉각적으로 감지하기 어렵다. 개발자나 운영자가 장애를 수동으로 확인하거나 사용자 신고에 의존하는 경우, 장애 인지까지 수십 분에서 수 시간이 소요되어 서비스 신뢰도가 저하된다.

### 1.2 비즈니스 목표

- 사용자가 모니터링할 API를 직접 등록하고 주기적으로 자동 호출하여 장애를 즉시 감지할 수 있도록 한다.
- 오류 감지 시 관련 데이터(상태 코드, 응답 시간 등)를 기록하여 장애 원인 분석의 기초 데이터를 제공한다.
- API 모니터링의 설정·관리 권한을 인증된 사용자에게 위임하여 Self-Service 운영 환경을 구성한다.

### 1.3 성공 지표 (KPI)

| 지표 | 목표값 |
|------|--------|
| 모니터 등록 후 첫 호출 실행 지연 | 설정 주기의 ±10% 이내 |
| 모니터 목록 API 응답 시간 | P95 300ms 이하 |
| 모니터 CRUD API 응답 시간 | P95 200ms 이하 |
| 모니터 단건 조회 API 응답 시간 | P95 100ms 이하 |

---

## 2. 사용자 및 이해관계자

### 2.1 타겟 사용자

| 페르소나 | 설명 |
|----------|------|
| **서비스 운영자** | 운영 중인 API의 가용성을 상시 확인해야 하는 개발자 또는 인프라 담당자 |
| **QA 엔지니어** | 테스트 환경의 특정 엔드포인트 상태를 주기적으로 확인하려는 담당자 |

### 2.2 사용자 스토리

| ID | 사용자 스토리 |
|----|--------------|
| US-001 | 나는 **서비스 운영자**로서, 운영 중인 API 엔드포인트를 모니터링 대상으로 등록하여 장애를 자동으로 감지하고 싶다. |
| US-002 | 나는 **서비스 운영자**로서, 호출 주기·성공 기준을 커스터마이징하여 서비스 특성에 맞는 모니터링을 설정하고 싶다. |
| US-003 | 나는 **서비스 운영자**로서, 등록한 모니터 목록을 페이지 단위로 조회하고 필요한 경우 설정을 수정하고 싶다. |
| US-004 | 나는 **서비스 운영자**로서, 점검 기간 동안 특정 모니터를 비활성화하여 불필요한 오류 알림을 방지하고 싶다. |
| US-005 | 나는 **서비스 운영자**로서, 더 이상 사용하지 않는 모니터를 삭제하여 목록을 정리하고 싶다. |

### 2.3 이해관계자 요구사항

- **개발팀**: 기존 모노레포 구조(User App / Admin App)와 일관된 코드 컨벤션 유지
- **인프라팀**: 스케줄러 실행 부하가 기존 서버 자원 범위 내에서 처리 가능해야 함
- **QA팀**: 모든 CRUD 엔드포인트에 대해 수용 기준(Acceptance Criteria)이 명확히 정의되어야 함

---

## 3. 제품 범위

### 3.1 포함 범위 (In Scope)

- 모니터링 대상 API 등록 (URL, HTTP 메소드, 헤더, 바디, 인증 토큰)
- 호출 주기 설정 (1분 / 5분 / 10분 / 30분 / 1시간)
- 성공/실패 판별 기준 설정 (기대 HTTP 상태 코드, 응답 시간 임계값)
- 모니터 수정, 삭제 (Soft Delete)
- 모니터 목록 조회 (Offset 페이지네이션)
- 모니터 단건 조회
- 모니터 활성화 / 비활성화 토글
- User App에 모니터 관리 API 제공 (인증 필수)

### 3.2 제외 범위 (Out of Scope)

- 오류 감지 시 알림 발송 (이메일, Slack, 웹훅 등) — 별도 알림 기능 PRD에서 다룸
- 모니터링 결과(히스토리/로그) 조회 — 별도 모니터 결과 PRD에서 다룸
- Admin App을 통한 전체 사용자 모니터 관리 — 향후 고려사항으로 분류
- 모니터 그룹화 및 태그 기능
- SSL 인증서 만료 감지

### 3.3 향후 고려사항

- Admin App의 RBAC 기반 전체 모니터 관리
- 알림 채널 연동 (이메일, Slack, PagerDuty)
- 모니터링 결과 대시보드 및 업타임 통계
- 모니터 그룹/태그 분류
- SSL/TLS 인증서 만료 감지 모니터

---

## 4. 기능 요구사항

### FR-001. 모니터 등록

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-001 |
| **기능명** | 모니터링 대상 API 등록 |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `POST /api/v1/monitors` |

**설명**

인증된 사용자가 모니터링할 API의 상세 정보를 입력하여 모니터를 생성한다. 생성된 모니터는 설정된 주기에 따라 서버 내 스케줄러가 자동으로 호출을 실행한다. 소유자(createdBy)는 JWT 페이로드에서 자동으로 설정된다.

**요청 필드**

| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| `name` | string | 필수 | 모니터 이름 (최대 100자) |
| `url` | string | 필수 | 모니터링 대상 URL (HTTPS 권장) |
| `method` | enum | 필수 | HTTP 메소드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| `headers` | object | 선택 | 요청 헤더 (key-value JSON 객체, 최대 20개) |
| `body` | object | 선택 | 요청 바디 (JSON 객체, method가 GET/DELETE인 경우 무시) |
| `authToken` | string | 선택 | Authorization 헤더에 주입할 Bearer 토큰 (AES-256-GCM 암호화 저장) |
| `intervalMinutes` | enum | 필수 | 호출 주기(분): `1`, `5`, `10`, `30`, `60` |
| `expectedStatusCode` | integer | 필수 | 성공으로 간주할 HTTP 상태 코드 (100~599) |
| `responseTimeThresholdMs` | integer | 필수 | 응답 시간 임계값(ms), 이 값을 초과하면 실패로 판정 (최소 100, 최대 30000) |

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 인증된 사용자가 유효한 요청 바디를 전송할 때, When `POST /api/v1/monitors`를 호출하면, Then HTTP 201과 생성된 모니터 데이터를 반환하고 `isActive: true`로 기본 설정된다.
- **AC-002**: Given `url` 필드가 누락된 요청을 전송할 때, When API를 호출하면, Then HTTP 400과 유효성 검사 오류를 반환한다.
- **AC-003**: Given `intervalMinutes`에 허용되지 않은 값(예: `15`)을 전송할 때, When API를 호출하면, Then HTTP 400을 반환한다.
- **AC-004**: Given 비인증 요청(Access Token 미제공)으로 호출할 때, When API를 호출하면, Then HTTP 401(`AUTH_ERROR_001`)을 반환한다.
- **AC-005**: Given `authToken`이 포함된 요청일 때, When 모니터가 저장되면, Then `authToken`은 AES-256-GCM으로 암호화되어 DB에 저장되고 응답에는 마스킹 처리된다.

---

### FR-002. 모니터 수정

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-002 |
| **기능명** | 모니터 정보 수정 |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `PATCH /api/v1/monitors/:id` |

**설명**

모니터 소유자가 기존 모니터의 설정 정보를 수정한다. 수정 가능한 필드는 등록 시 입력 가능한 모든 필드와 동일하다. 요청에 포함된 필드만 선택적으로 업데이트하는 Partial Update 방식을 사용한다.

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 모니터 소유자가 유효한 수정 요청을 전송할 때, When `PATCH /api/v1/monitors/:id`를 호출하면, Then HTTP 200과 수정된 모니터 전체 데이터를 반환한다.
- **AC-002**: Given 모니터 소유자가 아닌 사용자가 수정 요청을 전송할 때, When API를 호출하면, Then HTTP 403(`MONITOR_ERROR_002`)을 반환한다.
- **AC-003**: Given 존재하지 않는 `id`로 요청할 때, When API를 호출하면, Then HTTP 404(`MONITOR_ERROR_001`)을 반환한다.
- **AC-004**: Given 삭제된 모니터에 대한 수정 요청을 전송할 때, When API를 호출하면, Then HTTP 404(`MONITOR_ERROR_001`)를 반환한다.

---

### FR-003. 모니터 삭제

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-003 |
| **기능명** | 모니터 삭제 (Soft Delete) |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `DELETE /api/v1/monitors/:id` |

**설명**

모니터 소유자가 모니터를 삭제한다. 물리적 삭제는 수행하지 않으며, `isDeleted: true`, `deletedAt`, `deletedBy`를 기록하는 Soft Delete 방식을 사용한다. 삭제된 모니터는 스케줄러 호출 대상에서 즉시 제외된다.

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 모니터 소유자가 삭제 요청을 전송할 때, When `DELETE /api/v1/monitors/:id`를 호출하면, Then HTTP 200을 반환하고 해당 모니터의 `isDeleted`가 `true`로 설정된다.
- **AC-002**: Given 모니터 소유자가 아닌 사용자가 삭제 요청을 전송할 때, When API를 호출하면, Then HTTP 403(`MONITOR_ERROR_002`)을 반환한다.
- **AC-003**: Given 이미 삭제된 모니터에 대해 재삭제 요청을 전송할 때, When API를 호출하면, Then HTTP 400(`MONITOR_ERROR_005`)을 반환한다.
- **AC-004**: Given 모니터가 삭제된 이후, When 스케줄러가 실행되면, Then 삭제된 모니터는 호출 대상에서 제외된다.

---

### FR-004. 모니터 목록 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-004 |
| **기능명** | 내 모니터 목록 조회 (Offset 페이지네이션) |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `GET /api/v1/monitors` |

**설명**

인증된 사용자가 자신이 등록한 모니터 목록을 페이지 단위로 조회한다. 본인 소유의 삭제되지 않은 모니터만 반환된다.

**쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | integer | 1 | 조회할 페이지 번호 (최소 1) |
| `size` | integer | 20 | 페이지당 항목 수 (최소 1, 최대 100) |
| `order` | enum | `DESC` | 정렬 방향: `ASC`, `DESC` (생성일 기준) |
| `isActive` | boolean | - | 활성화 상태 필터 (미입력 시 전체 조회) |

**응답 형식**

```json
{
  "data": [
    {
      "id": 1,
      "name": "결제 API 모니터",
      "url": "https://api.example.com/payments/health",
      "method": "GET",
      "intervalMinutes": 5,
      "expectedStatusCode": 200,
      "responseTimeThresholdMs": 500,
      "isActive": true,
      "createdAt": "2026-03-19T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "totalCount": 42
  }
}
```

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 인증된 사용자가 파라미터 없이 요청할 때, When `GET /api/v1/monitors`를 호출하면, Then HTTP 200과 본인 소유의 삭제되지 않은 모니터 목록(기본 20개)을 반환한다.
- **AC-002**: Given `isActive=true`로 필터 요청할 때, When API를 호출하면, Then 활성화된 모니터만 반환된다.
- **AC-003**: Given 목록 응답에서, Then `authToken`·`body`·`headers`의 민감 필드는 포함하지 않는다.
- **AC-004**: Given 다른 사용자가 소유한 모니터는, When 어떤 사용자가 목록을 조회해도, Then 해당 사용자의 응답에 포함되지 않는다.

---

### FR-005. 모니터 단건 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-005 |
| **기능명** | 모니터 단건 조회 |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `GET /api/v1/monitors/:id` |

**설명**

모니터 소유자가 특정 모니터의 전체 설정 정보를 조회한다. 응답에 `authToken`은 포함하지 않으며(마스킹), `headers`와 `body`는 전체 내용을 포함한다.

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 모니터 소유자가 유효한 `id`로 요청할 때, When `GET /api/v1/monitors/:id`를 호출하면, Then HTTP 200과 모니터 전체 상세 데이터를 반환한다.
- **AC-002**: Given 모니터 소유자가 아닌 사용자가 조회 요청을 전송할 때, When API를 호출하면, Then HTTP 403(`MONITOR_ERROR_002`)을 반환한다.
- **AC-003**: Given 존재하지 않거나 삭제된 `id`로 요청할 때, When API를 호출하면, Then HTTP 404(`MONITOR_ERROR_001`)를 반환한다.
- **AC-004**: Given 단건 조회 응답에서, Then `authToken`은 마스킹 처리(`****`)되어 반환된다.

---

### FR-006. 모니터 활성화 / 비활성화

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-006 |
| **기능명** | 모니터 활성화 / 비활성화 토글 |
| **우선순위** | P0 (필수) |
| **대상 앱** | User App |
| **엔드포인트** | `PATCH /api/v1/monitors/:id/status` |

**설명**

모니터 소유자가 모니터의 `isActive` 상태를 전환한다. 비활성화된 모니터는 스케줄러의 호출 대상에서 제외되며, 활성화 시 다음 주기부터 즉시 호출 대상에 포함된다. FR-002(수정)와 엔드포인트를 분리하여 상태 전환 의도를 명확히 한다.

**요청 필드**

| 필드명 | 타입 | 필수 여부 | 설명 |
|--------|------|-----------|------|
| `isActive` | boolean | 필수 | `true`(활성화) 또는 `false`(비활성화) |

**수용 기준 (Acceptance Criteria)**

- **AC-001**: Given 현재 `isActive: true`인 모니터에 대해 `{ "isActive": false }` 요청을 전송할 때, When `PATCH /api/v1/monitors/:id/status`를 호출하면, Then HTTP 200을 반환하고 `isActive`가 `false`로 변경된다.
- **AC-002**: Given 현재 `isActive: false`인 모니터에 대해 `{ "isActive": true }` 요청을 전송할 때, When API를 호출하면, Then HTTP 200을 반환하고 `isActive`가 `true`로 변경되며 다음 호출 주기부터 스케줄링에 포함된다.
- **AC-003**: Given 이미 동일한 `isActive` 상태인 모니터에 대해 같은 값으로 요청할 때, When API를 호출하면, Then HTTP 200을 반환하며 상태는 변경되지 않는다.
- **AC-004**: Given 모니터 소유자가 아닌 사용자가 상태 변경 요청을 전송할 때, When API를 호출하면, Then HTTP 403(`MONITOR_ERROR_002`)을 반환한다.

---

## 5. 비기능 요구사항

### NFR-001. 성능

| ID | 요구사항 |
|----|----------|
| NFR-001-1 | 모니터 단건 조회 API: P95 응답 시간 100ms 이하 |
| NFR-001-2 | 모니터 등록·수정·삭제·상태 변경 API: P95 응답 시간 200ms 이하 |
| NFR-001-3 | 모니터 목록 조회 API: P95 응답 시간 300ms 이하 |
| NFR-001-4 | 스케줄러는 동시에 활성화된 모니터 1,000개를 처리할 수 있어야 한다 |

### NFR-002. 보안

| ID | 요구사항 |
|----|----------|
| NFR-002-1 | 모든 엔드포인트는 JWT Access Token 인증을 요구한다 (`JwtAccessGuard` 전역 적용) |
| NFR-002-2 | `authToken` 필드는 AES-256-GCM으로 암호화하여 DB에 저장하며, 복호화 키는 환경변수로 관리한다 |
| NFR-002-3 | `authToken`은 API 응답에 평문으로 포함하지 않으며, 마스킹 처리하여 반환한다 |
| NFR-002-4 | 소유권 검증: 모든 수정·삭제·조회 작업은 `createdBy === JWT.id` 조건을 통해 소유권을 확인한다 |
| NFR-002-5 | `headers` 필드에 포함될 수 있는 민감 헤더(Authorization 등)는 저장 시 암호화한다 |

### NFR-003. 확장성

| ID | 요구사항 |
|----|----------|
| NFR-003-1 | 모니터 스케줄러는 수평 확장(인스턴스 추가) 시 중복 실행이 방지되어야 한다 (분산 락 또는 DB 기반 잠금 사용) |
| NFR-003-2 | 사용자당 등록 가능한 모니터 최대 수는 초기 100개로 제한하며, 설정으로 조정 가능해야 한다 |

### NFR-004. 가용성

| ID | 요구사항 |
|----|----------|
| NFR-004-1 | User API 업타임 99.9% 이상 |
| NFR-004-2 | 스케줄러 실행 실패 시 해당 모니터의 오류를 기록하고 다음 주기에 자동으로 재시도한다 |
| NFR-004-3 | 스케줄러가 재시작되어도 활성화된 모니터 목록을 DB에서 재로딩하여 스케줄을 복원한다 |

### NFR-005. 데이터 무결성

| ID | 요구사항 |
|----|----------|
| NFR-005-1 | 물리 삭제(Hard Delete) 없음. 모든 삭제는 Soft Delete 방식을 사용한다 |
| NFR-005-2 | 모든 테이블에 감사 필드(`createdAt`, `createdBy`, `updatedAt`, `updatedBy`, `isDeleted`, `deletedAt`, `deletedBy`)가 포함된다 |
| NFR-005-3 | 감사 필드(`createdBy`, `updatedBy`, `deletedBy`)는 CLS를 통해 자동으로 주입한다 |

### NFR-006. Rate Limiting

| ID | 요구사항 |
|----|----------|
| NFR-006-1 | 모니터 등록·수정·삭제 엔드포인트: IP당 5회/분, 사용자당 5회/분 (민감 엔드포인트 기준 적용) |
| NFR-006-2 | 모니터 조회 엔드포인트: 전역 기본값 적용 (IP/User 각 10,000회/60초) |
| NFR-006-3 | Rate Limiting은 Redis 기반 분산 방식으로 구현한다 |

---

## 6. 기술 요구사항 및 제약사항

### 6.1 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 11, TypeScript 5.7 |
| 데이터베이스 | PostgreSQL + Prisma 7.2 (`@prisma/adapter-pg`, 커넥션 풀 max 10) |
| 캐시 / 분산 락 | Redis (ioredis) |
| 인증 | Passport.js + JWT (`@libs/common`) |
| 스케줄러 | `@nestjs/schedule` (Cron 기반) |
| HTTP 클라이언트 | NestJS `HttpModule` (`axios` 기반) |
| 암호화 | Node.js 내장 `crypto` 모듈 (AES-256-GCM) |
| 유효성 검증 | `class-validator`, `class-transformer` |
| API 문서 | Swagger (`@libs/common/config/swagger`) |

### 6.2 데이터 모델

#### Monitor 테이블

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | Int (PK, Auto Increment) | 모니터 고유 식별자 |
| `userId` | Int (FK → user.id) | 모니터 소유자 |
| `name` | String | 모니터 이름 (최대 100자) |
| `url` | String | 모니터링 대상 URL |
| `method` | Enum (HttpMethod) | HTTP 메소드 |
| `headers` | Json? | 요청 헤더 (암호화 저장) |
| `body` | Json? | 요청 바디 |
| `authToken` | String? | Bearer 토큰 (AES-256-GCM 암호화) |
| `intervalMinutes` | Int | 호출 주기 (분) |
| `expectedStatusCode` | Int | 성공 기준 HTTP 상태 코드 |
| `responseTimeThresholdMs` | Int | 응답 시간 임계값 (ms) |
| `isActive` | Boolean | 활성화 여부 (기본값: true) |
| `createdAt` | DateTime | 생성 일시 |
| `createdBy` | Int? | 생성자 ID |
| `updatedAt` | DateTime? | 수정 일시 |
| `updatedBy` | Int? | 수정자 ID |
| `isDeleted` | Boolean | Soft Delete 여부 (기본값: false) |
| `deletedAt` | DateTime? | 삭제 일시 |
| `deletedBy` | Int? | 삭제자 ID |

#### 추가 Enum

```prisma
enum HttpMethod {
  GET
  POST
  PUT
  PATCH
  DELETE

  @@schema("public")
}
```

### 6.3 API 경로 규칙

- User App 기준 API 경로: `/api/v1/monitors`
- Swagger 문서: `http://localhost:3000/api/docs`

### 6.4 통합 요구사항

| 통합 대상 | 용도 |
|-----------|------|
| `@libs/common` | JWT 가드, CLS 미들웨어, 공통 예외, OffsetResponseDto |
| `@libs/prisma` | PrismaService를 통한 DB 접근 |
| Redis | Rate Limiting, 스케줄러 분산 락 |
| `@nestjs/schedule` | 주기적 모니터 호출 스케줄링 |

### 6.5 기술적 제약사항

- `PrismaClient`는 반드시 `PrismaService`를 통해서만 접근 (`@libs/prisma` ESLint 규칙 준수)
- 모든 조회 쿼리에 `isDeleted: false` 조건을 반드시 포함
- `authToken`은 평문으로 DB에 저장 금지; 저장 전 암호화, 응답 시 마스킹 처리
- 스케줄러는 서버 시작 시 `isActive: true` AND `isDeleted: false` 조건의 모니터를 DB에서 로딩하여 등록

---

## 7. 에러 코드 정의

| 에러 코드 | HTTP 상태 | 설명 |
|-----------|-----------|------|
| `AUTH_ERROR_001` | 401 | Access Token 미제공 또는 만료 |
| `AUTH_ERROR_008` | 403 | RBAC 권한 없음 (Admin App 전용) |
| `MONITOR_ERROR_001` | 404 | 모니터를 찾을 수 없음 (존재하지 않거나 삭제됨) |
| `MONITOR_ERROR_002` | 403 | 모니터 소유권 없음 |
| `MONITOR_ERROR_003` | 400 | 유효하지 않은 요청 필드 |
| `MONITOR_ERROR_004` | 429 | Rate Limit 초과 |
| `MONITOR_ERROR_005` | 400 | 이미 삭제된 모니터에 대한 재삭제 요청 |
| `MONITOR_ERROR_006` | 422 | 사용자당 모니터 최대 등록 수 초과 |

---

## 8. 의존성 및 리스크

### 8.1 의존성

| 의존 대상 | 유형 | 설명 |
|-----------|------|------|
| `@libs/common` | 내부 라이브러리 | JWT 가드, CLS, 공통 DTO, Rate Limiting 모듈 |
| `@libs/prisma` | 내부 라이브러리 | PrismaService, DB 스키마 |
| Redis | 인프라 | Rate Limiting, 스케줄러 분산 락 |
| PostgreSQL | 인프라 | 모니터 데이터 영속성 |
| `@nestjs/schedule` | 외부 패키지 | Cron 기반 스케줄러 |

### 8.2 리스크

| 리스크 | 발생 가능성 | 영향도 | 완화 전략 |
|--------|-------------|--------|-----------|
| 스케줄러 중복 실행 (수평 확장 시) | 중 | 높음 | Redis 기반 분산 락(NX, EX 옵션)을 사용하여 동일 주기 내 중복 실행 방지 |
| 외부 API 호출 타임아웃으로 인한 스케줄러 블로킹 | 중 | 중 | HTTP 클라이언트에 최대 타임아웃(`responseTimeThresholdMs + 여유 1초`) 설정; 비동기 처리로 스케줄러 블로킹 방지 |
| 암호화 키 유출로 인한 `authToken` 노출 | 낮음 | 매우 높음 | 암호화 키를 환경변수로 관리; 비밀 관리 시스템(Secret Manager) 연동 권장 |
| 사용자당 모니터 대량 등록으로 인한 DB/스케줄러 과부하 | 낮음 | 높음 | 사용자당 최대 100개 제한; 설정값으로 조정 가능하도록 구현 |

### 8.3 가정사항

- User App의 인증 구조(`JwtAccessGuard`, CLS 미들웨어)는 이미 구현되어 있다.
- Redis 인프라는 기존 Rate Limiting 용도로 이미 운영 중이다.
- 스케줄러는 User App 내에서 동작하며, 별도 Worker 프로세스로 분리하지 않는다 (초기 버전 기준).
- 모니터링 결과(성공/실패 로그) 저장 기능은 별도 PRD에서 다루며 이번 범위에 포함되지 않는다.

---

## 9. 타임라인 및 마일스톤

| 마일스톤 | 포함 기능 | 예상 완료 |
|----------|-----------|-----------|
| **M1 - 모니터 CRUD** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006 | TBD |
| **M2 - 스케줄러 연동** | 스케줄러 등록/해제, 활성/비활성 동기화 | TBD |
| **M3 - 보안 강화** | authToken 암호화, headers 암호화, Rate Limiting 적용 | TBD |

> 구체적인 일정은 팀 스프린트 계획 확정 후 업데이트한다.

---

## 10. 부록

### 10.1 용어 정의

| 용어 | 정의 |
|------|------|
| 모니터 | 사용자가 등록한 모니터링 대상 API 설정 단위 |
| 활성화 (isActive) | 스케줄러가 해당 모니터를 주기적으로 호출하는 상태 |
| 비활성화 | 스케줄러 호출 대상에서 제외된 상태; 설정 데이터는 유지됨 |
| Soft Delete | 물리적 레코드 삭제 없이 `isDeleted: true` 플래그로 논리 삭제하는 방식 |
| 응답 시간 임계값 | 이 시간(ms)을 초과하는 응답은 성공 상태 코드와 무관하게 실패로 판정 |
| 호출 주기 | 스케줄러가 모니터 대상 API를 반복 호출하는 시간 간격 |
| authToken | 모니터링 대상 API 호출 시 `Authorization: Bearer {token}` 헤더에 주입하는 인증 토큰 |

### 10.2 참고 자료

- NestJS Schedule 공식 문서: https://docs.nestjs.com/techniques/task-scheduling
- Prisma Docs: https://www.prisma.io/docs
- CLAUDE.md — 프로젝트 아키텍처 및 컨벤션

### 10.3 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2026-03-19 | 최초 작성 | [담당자] |
