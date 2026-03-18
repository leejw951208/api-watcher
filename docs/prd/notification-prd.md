# 알림 기능 PRD (Product Requirements Document)

---

## 문서 개요

| 항목 | 내용 |
|------|------|
| **문서 제목** | 알림 기능 PRD |
| **버전** | 1.0 |
| **작성일** | 2026-03-15 |
| **작성자** | 개발팀 |
| **상태** | 구현 완료 |
| **대상 앱** | Admin App, User App |
| **이해관계자** | 개발팀, 운영팀, 서비스 기획팀 |

---

## 1. 배경 및 목적

### 1.1 문제 정의

서비스 운영 중 관리자가 특정 사용자 또는 전체 사용자에게 공지·알림을 발송할 수단이 없다. 또한 게시글·댓글·시스템 이벤트 발생 시 사용자에게 인앱 알림을 전달하는 인프라가 부재하여, 중요한 서비스 정보를 사용자가 적시에 수신하지 못하는 문제가 있다.

### 1.2 비즈니스 목표

- 관리자가 개인 대상 알림 및 전체 공지를 통합된 인터페이스에서 발송할 수 있도록 한다.
- 사용자가 자신과 관련된 알림(개인 알림 + 전체 공지)을 하나의 목록에서 조회하고 읽음 처리할 수 있도록 한다.
- 알림 읽음 상태를 정확하게 추적하여 미읽음 알림 수 등 후속 기능 구현의 기반을 마련한다.

### 1.3 성공 지표 (KPI)

| 지표 | 목표 |
|------|------|
| 알림 발송 성공률 | 99% 이상 |
| 알림 목록 조회 응답 시간 | 200ms 이하 (p99) |
| 읽음 처리 멱등성 보장 | 중복 요청 시 오류 없이 처리 (204 반환) |
| N+1 쿼리 발생 건수 | 0건 (배치 조회로 방지) |

---

## 2. 사용자 및 이해관계자

### 2.1 타겟 사용자

| 구분 | 설명 |
|------|------|
| **서비스 사용자 (User)** | 알림을 수신하고 읽음 처리하는 일반 사용자 |
| **관리자 (Admin)** | 알림을 생성하고 발송 현황을 조회하는 운영 담당자 |

### 2.2 사용자 스토리

**관리자 관점**

- US-001: 나는 관리자로서, 특정 사용자에게 개인 알림을 발송하고 싶다. 그래서 서비스 내 중요한 정보를 해당 사용자에게만 전달할 수 있다.
- US-002: 나는 관리자로서, 전체 사용자를 대상으로 공지를 발송하고 싶다. 그래서 서비스 공지사항이나 이벤트 정보를 모든 사용자에게 동시에 전달할 수 있다.
- US-003: 나는 관리자로서, 발송된 알림 목록을 사용자·타입·키워드로 필터링하여 조회하고 싶다. 그래서 발송 현황을 효율적으로 관리할 수 있다.

**사용자 관점**

- US-004: 나는 서비스 사용자로서, 나에게 온 알림(개인 알림 + 전체 공지)을 하나의 목록에서 최신순으로 조회하고 싶다. 그래서 중요한 정보를 놓치지 않을 수 있다.
- US-005: 나는 서비스 사용자로서, 특정 알림을 읽음 처리하거나 전체 알림을 한 번에 읽음 처리하고 싶다. 그래서 이미 확인한 알림과 미확인 알림을 구분할 수 있다.
- US-006: 나는 서비스 사용자로서, 필요 없는 알림을 삭제하고 싶다. 그래서 알림 목록을 깔끔하게 유지할 수 있다.
- US-007: 나는 서비스 사용자로서, 읽음 여부와 타입으로 알림을 필터링하여 조회하고 싶다. 그래서 원하는 알림을 빠르게 찾을 수 있다.

---

## 3. 제품 범위

### 3.1 포함 범위 (In Scope)

- Admin App: 알림 생성(개인/전체), 알림 목록 조회(Offset 페이지네이션)
- User App: 알림 목록 조회(Cursor 페이지네이션), 알림 상세 조회, 단건 읽음 처리, 전체 읽음 처리, 알림 Soft Delete
- 알림 타입 분류: SYSTEM, POST, COMMENT, USER
- 읽음 상태 추적: 별도 `NotificationRead` 테이블을 통한 사용자별 읽음 기록 관리
- N+1 방지: 배치 조회 및 Map 기반 O(1) 매핑

### 3.2 제외 범위 (Out of Scope)

- 실시간 푸시 알림 (SSE/WebSocket 기반 실시간 알림 스트리밍)
- 이메일·SMS 등 외부 채널을 통한 알림 발송
- 알림 예약 발송 (특정 시각에 자동 발송)
- 알림별 클릭 이벤트 추적 및 분석
- 알림 템플릿 관리 기능

### 3.3 향후 고려사항

- 실시간 알림 수신 (SSE 또는 WebSocket 연동)
- 미읽음 알림 카운트 API (`GET /api/v1/users/me/notifications/unread-count`)
- 알림 발송 이력 통계 (관리자 대시보드)
- 사용자 알림 수신 설정 (타입별 수신 ON/OFF)

---

## 4. 기능 요구사항

### 4.1 Admin App — 알림 발송/관리

#### FR-001: 알림 생성

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-001 |
| **기능명** | 알림 생성 |
| **엔드포인트** | `POST /admin/api/v1/notifications` |
| **우선순위** | P0 (필수) |
| **Permission** | `notification:write` |
| **HTTP 상태 코드** | 201 Created |

**설명**

관리자가 알림을 생성한다. `userId` 필드를 지정하면 해당 사용자에게 발송되는 개인 알림이 되고, `userId`를 생략(null)하면 전체 사용자 대상 공지로 생성된다.

**요청 파라미터**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `userId` | number | 선택 | 수신 대상 사용자 ID. 미지정 시 전체 공지 |
| `title` | string | 필수 | 알림 제목 (최대 100자) |
| `content` | string | 필수 | 알림 내용 (최대 500자) |
| `type` | NotificationType | 필수 | 알림 타입 (SYSTEM, POST, COMMENT, USER) |

**수용 기준 (Acceptance Criteria)**

- Given 관리자가 유효한 `notification:write` 권한을 가지고 있을 때, When `userId`를 포함하여 알림 생성을 요청하면, Then 해당 `userId`를 가진 개인 알림이 생성되고 201이 반환된다.
- Given 관리자가 유효한 `notification:write` 권한을 가지고 있을 때, When `userId` 없이 알림 생성을 요청하면, Then `userId=null`인 전체 공지 알림이 생성되고 201이 반환된다.
- Given 권한 없는 관리자일 때, When 알림 생성을 요청하면, Then 403 Forbidden이 반환된다.
- Given 제목이 100자를 초과할 때, When 알림 생성을 요청하면, Then 400 Bad Request가 반환된다.

---

#### FR-002: 알림 목록 조회 (Admin)

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-002 |
| **기능명** | 알림 목록 조회 (관리자) |
| **엔드포인트** | `GET /admin/api/v1/notifications` |
| **우선순위** | P0 (필수) |
| **Permission** | `notification:read` |
| **HTTP 상태 코드** | 200 OK |

**설명**

관리자가 발송된 알림 목록을 Offset 페이지네이션으로 조회한다. `userId`, `type`, `keyword`로 필터링할 수 있다.

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `page` | number | 선택 | 페이지 번호 (기본값: 1) |
| `limit` | number | 선택 | 페이지당 항목 수 (기본값: 20) |
| `userId` | number | 선택 | 특정 사용자 알림 필터 |
| `type` | NotificationType | 선택 | 알림 타입 필터 |
| `keyword` | string | 선택 | 제목 + 내용 텍스트 검색 |

**수용 기준**

- Given 유효한 `notification:read` 권한을 가진 관리자일 때, When 조건 없이 목록을 요청하면, Then 전체 알림 목록이 페이지네이션 형태로 반환된다.
- Given `keyword`를 포함하여 요청할 때, When 검색을 수행하면, Then 제목 또는 내용에 해당 키워드가 포함된 알림만 반환된다.
- Given `type=SYSTEM`으로 요청할 때, When 목록을 조회하면, Then SYSTEM 타입 알림만 반환된다.

---

### 4.2 User App — 알림 수신

#### FR-003: 내 알림 목록 조회 (Cursor 페이지네이션)

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-003 |
| **기능명** | 내 알림 목록 조회 |
| **엔드포인트** | `GET /api/v1/users/me/notifications/cursor` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **HTTP 상태 코드** | 200 OK |

**설명**

로그인한 사용자의 알림 목록을 Cursor 기반 페이지네이션으로 조회한다. 개인 알림(`userId=나`)과 전체 공지(`userId=null`)를 동시에 조회한다. `isRead`, `type` 필터를 지원한다.

**조회 조건 (WHERE)**

```
isDeleted = false
AND (userId = 나 OR userId = null)
AND (isRead 필터 적용 시):
  - isRead=true  → notificationReads에 나의 읽음 기록이 존재
  - isRead=false → notificationReads에 나의 읽음 기록이 없음
```

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `cursor` | number | 선택 | 마지막으로 조회한 알림 ID (첫 조회 시 생략) |
| `limit` | number | 선택 | 조회할 항목 수 (기본값: 20) |
| `isRead` | boolean | 선택 | 읽음 여부 필터 |
| `type` | NotificationType | 선택 | 알림 타입 필터 |

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 알림 ID |
| `title` | string | 알림 제목 |
| `content` | string | 알림 내용 |
| `type` | NotificationType | 알림 타입 |
| `isRead` | boolean | 읽음 여부 (NotificationRead 기반 계산) |
| `readAt` | DateTime \| null | 읽음 처리 시각 |
| `createdAt` | DateTime | 알림 생성 시각 |
| `nextCursor` | number \| null | 다음 페이지 커서 (마지막 페이지면 null) |

**수용 기준**

- Given 인증된 사용자일 때, When 알림 목록을 요청하면, Then 해당 사용자의 개인 알림과 전체 공지가 함께 최신순으로 반환된다.
- Given `isRead=false`로 요청할 때, When 목록을 조회하면, Then 사용자가 읽지 않은 알림만 반환된다.
- Given `cursor` 값을 포함하여 요청할 때, When 다음 페이지를 조회하면, Then 해당 cursor 이후의 알림들이 반환된다.
- Given 삭제된 알림(`isDeleted=true`)이 존재할 때, When 목록을 조회하면, Then 해당 알림은 결과에 포함되지 않는다.

---

#### FR-004: 알림 상세 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-004 |
| **기능명** | 알림 상세 조회 |
| **엔드포인트** | `GET /api/v1/notifications/:id` |
| **우선순위** | P1 (중요) |
| **인증** | JWT Access Token 필요 |
| **HTTP 상태 코드** | 200 OK |

**설명**

특정 알림의 상세 정보를 조회한다. 해당 알림이 존재하지 않거나 삭제된 경우 404를 반환한다.

**경로 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | number | 필수 | 조회할 알림 ID |

**수용 기준**

- Given 존재하는 알림 ID로 요청할 때, When 상세 조회를 수행하면, Then 해당 알림의 전체 정보와 읽음 상태가 반환된다.
- Given 존재하지 않는 알림 ID로 요청할 때, When 상세 조회를 수행하면, Then 404와 에러 코드 `NOTIFICATION_ERROR_001`이 반환된다.
- Given 삭제된 알림 ID로 요청할 때, When 상세 조회를 수행하면, Then 404와 에러 코드 `NOTIFICATION_ERROR_001`이 반환된다.

---

#### FR-005: 단건 읽음 처리

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-005 |
| **기능명** | 단건 읽음 처리 |
| **엔드포인트** | `PATCH /api/v1/notifications/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **HTTP 상태 코드** | 204 No Content |

**설명**

특정 알림을 읽음 처리한다. 이미 읽음 처리된 알림에 대해 중복 요청이 와도 오류 없이 204를 반환한다(멱등성 보장). 읽음 기록은 `NotificationRead` 테이블에 저장된다.

**처리 로직**

1. `NotificationRead` 테이블에서 해당 사용자의 읽음 기록을 조회한다.
2. 이미 읽음 기록이 존재하면 조기 반환 (204 반환, DB 추가 write 없음).
3. 읽음 기록이 없으면 `NotificationRead`에 레코드를 생성한다.

**경로 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | number | 필수 | 읽음 처리할 알림 ID |

**수용 기준**

- Given 읽지 않은 알림이 존재할 때, When 읽음 처리를 요청하면, Then `NotificationRead`에 읽음 기록이 생성되고 204가 반환된다.
- Given 이미 읽음 처리된 알림에 When 동일 요청을 재전송하면, Then 중복 레코드 생성 없이 204가 반환된다(멱등성 보장).
- Given 존재하지 않는 알림 ID로 요청할 때, When 읽음 처리를 요청하면, Then 404와 `NOTIFICATION_ERROR_001`이 반환된다.

---

#### FR-006: 전체 읽음 처리

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-006 |
| **기능명** | 전체 읽음 처리 |
| **엔드포인트** | `PATCH /api/v1/users/me/notifications/read-all` |
| **우선순위** | P1 (중요) |
| **인증** | JWT Access Token 필요 |
| **HTTP 상태 코드** | 204 No Content |

**설명**

사용자의 모든 미읽음 알림을 일괄 읽음 처리한다.

**처리 로직**

1. 사용자의 미읽음 알림 ID 목록을 조회한다 (`notificationReads.none({ userId })` 조건 적용).
2. 조회된 ID 목록에 대해 `createMany`로 읽음 기록을 일괄 생성한다.

**수용 기준**

- Given 미읽음 알림이 N개 존재하는 사용자일 때, When 전체 읽음 처리를 요청하면, Then N개의 `NotificationRead` 레코드가 생성되고 204가 반환된다.
- Given 이미 모든 알림을 읽은 사용자일 때, When 전체 읽음 처리를 요청하면, Then 추가 DB write 없이 204가 반환된다.

---

#### FR-007: 알림 삭제 (Soft Delete)

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-007 |
| **기능명** | 알림 삭제 |
| **엔드포인트** | `DELETE /api/v1/notifications/:id` |
| **우선순위** | P1 (중요) |
| **인증** | JWT Access Token 필요 |
| **HTTP 상태 코드** | 204 No Content |

**설명**

특정 알림을 Soft Delete 처리한다. 실제로 DB에서 레코드를 삭제하지 않고 `isDeleted=true`, `deletedAt`, `deletedBy` 필드를 업데이트한다. 삭제 이후 해당 알림은 조회 목록에서 제외된다.

**경로 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `id` | number | 필수 | 삭제할 알림 ID |

**수용 기준**

- Given 존재하는 알림 ID로 삭제를 요청할 때, When 삭제를 수행하면, Then `isDeleted=true`로 업데이트되고 204가 반환된다.
- Given 삭제 처리된 알림이 존재할 때, When 알림 목록을 조회하면, Then 해당 알림은 결과에 포함되지 않는다.
- Given 존재하지 않는 알림 ID로 요청할 때, When 삭제를 수행하면, Then 404와 `NOTIFICATION_ERROR_001`이 반환된다.

---

## 5. 비기능 요구사항

### 5.1 성능 (NFR-001)

| 기능 ID | 항목 | 요구사항 |
|---------|------|---------|
| NFR-001 | 알림 목록 조회 응답 시간 | p99 기준 200ms 이하 |
| NFR-001 | N+1 쿼리 방지 | 알림 목록 조회 시 읽음 상태는 배치 조회(`findReadsByNotificationIds`) + Map O(1) 매핑으로 처리 |
| NFR-001 | 전체 읽음 처리 쿼리 수 | 미읽음 ID 조회 1회 + `createMany` 1회 = 총 2회 이내 |

**읽음 상태 배치 조회 패턴**

```
1. 알림 목록 조회 (1 query)
2. 해당 알림 ID 목록으로 NotificationRead 배치 조회 (1 query)
3. Map<notificationId, NotificationRead> 생성 → O(1) 매핑
```

### 5.2 보안 (NFR-002)

| 기능 ID | 항목 | 요구사항 |
|---------|------|---------|
| NFR-002 | 인증 | User App 모든 알림 엔드포인트는 JWT Access Token 필수 (`JwtAccessGuard` 전역 적용) |
| NFR-002 | 인가 | Admin App 알림 엔드포인트는 `PermissionGuard`를 통해 RBAC 권한 검사 |
| NFR-002 | 권한 분리 | 알림 생성은 `notification:write`, 알림 조회는 `notification:read` 권한으로 분리 |
| NFR-002 | 데이터 격리 | 사용자는 자신의 알림(`userId=나`) 또는 전체 공지(`userId=null`)만 조회 가능 |

### 5.3 데이터 정합성 (NFR-003)

| 기능 ID | 항목 | 요구사항 |
|---------|------|---------|
| NFR-003 | 읽음 처리 멱등성 | 동일 알림에 대한 중복 읽음 처리 요청 시 오류 없이 처리 |
| NFR-003 | Soft Delete | 알림 삭제 시 물리 삭제 금지, `isDeleted=true` 마킹 |
| NFR-003 | 감사 필드 | 모든 생성·수정·삭제 작업에 `createdBy`, `updatedBy`, `deletedBy` 자동 기록 (CLS 미들웨어 기반) |

### 5.4 확장성 (NFR-004)

| 기능 ID | 항목 | 요구사항 |
|---------|------|---------|
| NFR-004 | User App 페이지네이션 | Cursor 기반 (무한 스크롤, 데이터 삽입 시 페이지 밀림 없음) |
| NFR-004 | Admin App 페이지네이션 | Offset 기반 (관리 도구 특성상 특정 페이지 이동 필요) |
| NFR-004 | DB 인덱스 | `Notification.[userId, createdAt]` 복합 인덱스로 조회 성능 보장 |

### 5.5 가용성 (NFR-005)

| 기능 ID | 항목 | 요구사항 |
|---------|------|---------|
| NFR-005 | 서비스 업타임 | 99.9% 이상 |
| NFR-005 | 장애 복구 | 알림 읽음 처리 실패 시 재시도 가능 (멱등성 보장) |

---

## 6. 기술 요구사항 및 제약사항

### 6.1 데이터 모델

#### Notification 테이블 (`public` 스키마)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 알림 ID |
| `userId` | Int \| null | FK → User.id | null이면 전체 공지 |
| `title` | String | varchar(100) | 알림 제목 |
| `content` | String | varchar(500) | 알림 내용 |
| `type` | NotificationType | Enum | SYSTEM, POST, COMMENT, USER |
| `createdAt` | DateTime | default: now() | 생성 시각 |
| `createdBy` | Int \| null | — | 생성자 ID |
| `updatedAt` | DateTime \| null | — | 수정 시각 |
| `updatedBy` | Int \| null | — | 수정자 ID |
| `isDeleted` | Boolean | default: false | Soft Delete 여부 |
| `deletedAt` | DateTime \| null | — | 삭제 시각 |
| `deletedBy` | Int \| null | — | 삭제자 ID |

**인덱스**: `[userId, createdAt]`

#### NotificationRead 테이블 (`public` 스키마)

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | Int | PK, Auto Increment | 읽음 기록 ID |
| `userId` | Int | FK → User.id | 읽은 사용자 ID |
| `notificationId` | Int | FK → Notification.id | 읽은 알림 ID |
| `createdAt` | DateTime | default: now() | 읽음 처리 시각 (= readAt) |

#### ER 관계

```
User ──1:N──> Notification          (userId, 개인 알림)
User ──1:N──> NotificationRead ──N:1──> Notification
```

### 6.2 알림 타입 Enum

| 값 | 설명 | 사용 예시 |
|----|------|---------|
| `SYSTEM` | 시스템 공지 | 서비스 점검, 정책 변경 |
| `POST` | 게시글 관련 | 게시글 좋아요, 조회 수 달성 |
| `COMMENT` | 댓글 관련 | 내 게시글에 댓글 작성 |
| `USER` | 사용자 관련 | 계정 상태 변경, 역할 부여 |

### 6.3 기술 스택

| 항목 | 기술 |
|------|------|
| **런타임** | Node.js + NestJS 11 |
| **언어** | TypeScript 5 |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` |
| **데이터베이스** | PostgreSQL (멀티 스키마: public, base, main) |
| **인증** | JWT (passport-jwt) |
| **아키텍처** | Monorepo (pnpm workspaces) — Admin App, User App, libs/common |

### 6.4 API 버전 관리

URI 기반 버전 관리. NestJS `VersioningType.URI` 적용.

- Admin App: `/admin/api/v1/notifications`
- User App: `/api/v1/users/me/notifications/cursor`, `/api/v1/notifications/:id`

### 6.5 레이어 아키텍처

```
Controller  → 라우트, 데코레이터, 응답 래핑
Service     → 비즈니스 로직, 에러 판단, DTO 변환
Repository  → Prisma 쿼리, 감사 필드 자동 주입, 페이지네이션
```

---

## 7. 에러 코드

| 에러 코드 | HTTP 상태 | 설명 | 발생 조건 |
|---------|----------|------|---------|
| `NOTIFICATION_ERROR_001` | 404 Not Found | 알림 없음 | 존재하지 않거나 삭제된 알림 ID로 요청 시 |

---

## 8. API 엔드포인트 요약

### Admin App

| 메서드 | 경로 | 설명 | Permission | 상태 코드 |
|-------|------|------|------------|---------|
| `POST` | `/admin/api/v1/notifications` | 알림 생성 (개별/전체) | `notification:write` | 201 |
| `GET` | `/admin/api/v1/notifications` | 알림 목록 조회 (Offset) | `notification:read` | 200 |

### User App

| 메서드 | 경로 | 설명 | 인증 | 상태 코드 |
|-------|------|------|------|---------|
| `GET` | `/api/v1/users/me/notifications/cursor` | 내 알림 목록 (Cursor) | JWT | 200 |
| `GET` | `/api/v1/notifications/:id` | 알림 상세 조회 | JWT | 200 |
| `PATCH` | `/api/v1/notifications/:id` | 단건 읽음 처리 | JWT | 204 |
| `PATCH` | `/api/v1/users/me/notifications/read-all` | 전체 읽음 처리 | JWT | 204 |
| `DELETE` | `/api/v1/notifications/:id` | 알림 삭제 (Soft Delete) | JWT | 204 |

---

## 9. 의존성 및 리스크

### 9.1 의존성

| 항목 | 설명 |
|------|------|
| **User 모델** | 알림 수신 대상. `userId` FK 의존 |
| **RBAC (Role/Permission)** | Admin 알림 엔드포인트 접근 제어. `notification:read`, `notification:write` 권한이 시드 데이터에 존재해야 함 |
| **CLS 미들웨어** | 감사 필드(`createdBy`, `deletedBy`) 자동 주입을 위해 CLS(AsyncLocalStorage)에 사용자 ID가 저장되어야 함 |
| **Prisma** | `createMany` 지원 필요 (PostgreSQL에서 기본 지원) |

### 9.2 리스크

| 리스크 | 발생 가능성 | 영향도 | 완화 전략 |
|-------|-----------|-------|---------|
| 전체 공지 알림 대량 발송 시 NotificationRead 테이블 급증 | 중 | 중 | 인덱스 최적화, 오래된 읽음 기록 주기적 아카이빙 검토 |
| userId=null 공지 + 대량 사용자의 전체 읽음 처리 시 createMany 부하 | 중 | 중 | 배치 사이즈 제한, 비동기 큐 처리 전환 검토 (향후) |
| 읽음 처리 멱등성 위반 (동시 중복 요청) | 하 | 하 | DB 유니크 제약 또는 upsert 패턴 적용 검토 |

### 9.3 가정사항

- 알림 발송은 관리자가 Admin App을 통해 수동으로 생성한다. 자동 발송(이벤트 기반 트리거) 기능은 현재 범위에 포함되지 않는다.
- `NotificationRead` 테이블의 `[userId, notificationId]` 조합은 애플리케이션 레벨에서 중복을 방지한다 (멱등성 로직).
- 전체 공지(`userId=null`) 알림의 관리자 삭제는 현재 범위 외이다. 현재 삭제 API는 사용자 개인의 알림 숨김 처리로 동작한다.

---

## 10. 타임라인 및 마일스톤

| 마일스톤 | 상태 | 설명 |
|---------|------|------|
| DB 스키마 설계 (Notification, NotificationRead) | 완료 | Prisma 모델 정의, 인덱스 설정 |
| Admin App 알림 생성·목록 조회 API | 완료 | FR-001, FR-002 구현 |
| User App 알림 목록·상세·읽음·삭제 API | 완료 | FR-003 ~ FR-007 구현 |
| N+1 최적화 (배치 조회 + Map 매핑) | 완료 | 읽음 상태 조회 성능 최적화 |
| 멱등성 보장 (단건 읽음 처리) | 완료 | 중복 요청 조기 반환 처리 |

---

## 11. 부록

### 11.1 용어 정의

| 용어 | 정의 |
|------|------|
| **공지 (Broadcast Notification)** | `userId=null`인 알림. 전체 사용자에게 표시됨 |
| **개인 알림 (Personal Notification)** | `userId`가 지정된 알림. 해당 사용자에게만 표시됨 |
| **Soft Delete** | 레코드를 물리적으로 삭제하지 않고 `isDeleted=true`로 마킹하는 삭제 패턴 |
| **멱등성 (Idempotency)** | 동일한 요청을 여러 번 수행해도 결과가 동일한 성질 |
| **Cursor 페이지네이션** | 마지막으로 조회한 레코드의 ID(cursor)를 기준으로 다음 페이지를 조회하는 방식. 무한 스크롤에 적합 |
| **Offset 페이지네이션** | page/limit 기반으로 건너뛸 레코드 수를 지정하는 방식. 특정 페이지 이동에 적합 |
| **N+1 문제** | 목록 N개를 조회한 후 각 항목에 대해 추가 쿼리를 N번 실행하는 성능 문제 |
| **RBAC** | Role-Based Access Control. 역할(Role)에 권한(Permission)을 부여하는 접근 제어 방식 |
| **CLS** | Continuation Local Storage. 비동기 컨텍스트에서 요청별 데이터(사용자 ID 등)를 공유하는 메커니즘 |

### 11.2 참고 자료

| 문서 | 경로 |
|------|------|
| 알림 기능 구현 문서 | `docs/implemented/알림-기능.md` |
| 데이터베이스 스키마 | `docs/implemented/데이터베이스-스키마.md` |
| 인증 및 인가 | `docs/implemented/인증-인가.md` |
| 설계 패턴 | `docs/implemented/설계-패턴.md` |
| API 엔드포인트 목록 | `docs/implemented/API-엔드포인트.md` |

### 11.3 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|---------|------|
| 1.0 | 2026-03-15 | 최초 작성 | 개발팀 |
