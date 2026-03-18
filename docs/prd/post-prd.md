# 게시글 기능 PRD

---

| 항목 | 내용 |
|------|------|
| **문서 제목** | 게시글(Post) 기능 PRD |
| **버전** | 1.0 |
| **작성일** | 2026-03-15 |
| **작성자** | 개발팀 |
| **상태** | 승인됨 |
| **이해관계자** | 개발팀, 기획팀, 운영팀 |

---

## 목차

1. [배경 및 목적](#1-배경-및-목적)
2. [사용자 및 이해관계자](#2-사용자-및-이해관계자)
3. [제품 범위](#3-제품-범위)
4. [기능 요구사항](#4-기능-요구사항)
5. [비기능 요구사항](#5-비기능-요구사항)
6. [기술 요구사항 및 제약사항](#6-기술-요구사항-및-제약사항)
7. [의존성 및 리스크](#7-의존성-및-리스크)
8. [타임라인 및 마일스톤](#8-타임라인-및-마일스톤)
9. [부록](#9-부록)

---

## 1. 배경 및 목적

### 1.1 문제 정의

플랫폼 사용자들이 콘텐츠를 생산하고 공유할 수 있는 게시글 기능이 필요합니다. 사용자는 게시글을 작성, 조회, 수정, 삭제할 수 있어야 하며, 관리자는 플랫폼 내 모든 게시글을 모니터링하고 관리할 수 있어야 합니다.

### 1.2 비즈니스 목표

- 사용자 생성 콘텐츠(UGC) 기반의 플랫폼 핵심 기능 제공
- 관리자가 부적절한 콘텐츠를 신속히 처리할 수 있는 운영 도구 제공
- 콘텐츠 조회 현황 파악을 통한 인기 콘텐츠 분석 기반 마련
- 확장 가능한 페이지네이션 구조로 대규모 데이터에서도 안정적인 목록 조회 보장

### 1.3 성공 지표(KPI)

| 지표 | 목표 |
|------|------|
| 게시글 작성 API 응답 시간 | 200ms 이하 (P95) |
| 게시글 목록 조회 API 응답 시간 | 300ms 이하 (P95) |
| Soft Delete 처리율 | 삭제 요청의 100% |
| 관리자 상태 변경 처리 시간 | 100ms 이하 (P95) |

---

## 2. 사용자 및 이해관계자

### 2.1 타겟 사용자

| 사용자 유형 | 설명 | 역할 |
|------------|------|------|
| 일반 사용자 (USER) | 플랫폼에 가입한 일반 회원 | 게시글 CRUD, 목록 조회 |
| 프리미엄 사용자 (PREMIUM_USER) | 유료 회원 | 게시글 CRUD, 목록 조회 |
| 관리자 (ADMIN) | 플랫폼 운영 관리자 | 전체 게시글 조회, 상태 변경, 삭제 |
| 슈퍼 관리자 (SUPER_ADMIN) | 최고 권한 관리자 | 모든 기능 포함 |

### 2.2 사용자 스토리

**일반 사용자:**

- `US-001` 나는 일반 사용자로서, 플랫폼에 나의 생각을 공유하기 위해 게시글을 작성하고 싶다.
- `US-002` 나는 일반 사용자로서, 내가 작성한 게시글을 다시 확인하기 위해 내 게시글 상세를 조회하고 싶다.
- `US-003` 나는 일반 사용자로서, 잘못 작성한 내용을 수정하기 위해 내 게시글을 편집하고 싶다.
- `US-004` 나는 일반 사용자로서, 더 이상 필요하지 않은 게시글을 정리하기 위해 내 게시글을 삭제하고 싶다.
- `US-005` 나는 일반 사용자로서, 다른 사용자들의 콘텐츠를 탐색하기 위해 전체 게시글 목록을 페이지 단위로 조회하고 싶다.
- `US-006` 나는 일반 사용자로서, 끊김 없는 피드를 경험하기 위해 커서 기반 무한 스크롤로 게시글을 조회하고 싶다.
- `US-007` 나는 일반 사용자로서, 내가 작성한 게시글들을 한눈에 보기 위해 내 게시글 목록을 조회하고 싶다.

**관리자:**

- `US-008` 나는 관리자로서, 플랫폼 전체 콘텐츠를 파악하기 위해 모든 사용자의 게시글 목록을 조회하고 싶다.
- `US-009` 나는 관리자로서, 부적절한 콘텐츠를 처리하기 위해 게시글 상태를 변경(숨김 처리 등)하고 싶다.
- `US-010` 나는 관리자로서, 규정에 위반되는 콘텐츠를 제거하기 위해 게시글을 삭제하고 싶다.

### 2.3 이해관계자 요구사항

| 이해관계자 | 요구사항 |
|-----------|---------|
| 개발팀 | 확장 가능한 페이지네이션 구조, 일관된 에러 처리, 감사 로그 자동화 |
| 운영팀 | 직관적인 관리 API, 빠른 콘텐츠 상태 변경, 검색 필터 지원 |
| 보안팀 | RBAC 기반 권한 분리, Soft Delete를 통한 데이터 보존, 접근 이력 추적 |

---

## 3. 제품 범위

### 3.1 포함 범위(In Scope)

- 게시글 CRUD (작성, 조회, 수정, 삭제)
- Offset 페이지네이션 기반 목록 조회
- Cursor 페이지네이션 기반 목록 조회 (무한 스크롤)
- 조회수(viewCount) 자동 증가
- Soft Delete (데이터 보존형 삭제)
- 게시글 상태 관리 (DRAFT, PUBLISHED, HIDDEN)
- 관리자 게시글 관리 (목록 조회, 상세 조회, 상태 변경, 삭제)
- RBAC 기반 권한 제어 (post:write, post:delete, post:read, post:update)
- 감사 필드 자동 기록 (createdBy, updatedBy, deletedBy)
- 내 게시글 목록 조회 (Offset/Cursor)
- 제목, 상태, 사용자 ID 기반 검색 필터

### 3.2 제외 범위(Out of Scope)

- 게시글 댓글 기능
- 게시글 좋아요/반응 기능
- 게시글 태그 및 카테고리 분류
- 게시글 이미지/파일 첨부
- 게시글 공유/퍼가기 기능
- 게시글 신고 기능
- 전문 검색(Full-text Search) 기능
- 게시글 통계 대시보드

### 3.3 향후 고려사항

- 댓글 및 대댓글 기능 (v2)
- 게시글 좋아요 및 북마크 (v2)
- 이미지/파일 첨부 (파일 스토리지 연동 필요)
- Elasticsearch 기반 전문 검색
- 게시글 추천 알고리즘

---

## 4. 기능 요구사항

### 4.1 User App 기능

---

#### FR-001: 게시글 작성

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-001 |
| **기능명** | 게시글 작성 |
| **엔드포인트** | `POST /api/v1/posts` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | `post:write` |
| **응답 코드** | 201 Created |

**설명:**

인증된 사용자가 제목과 내용을 포함한 게시글을 작성합니다. 게시글 상태를 지정하지 않으면 기본값 `PUBLISHED`로 생성됩니다. 작성자 정보(`createdBy`)는 CLS(Context-Local Storage)에서 자동으로 주입되어 별도 입력이 불필요합니다.

**요청 본문:**

```json
{
  "title": "게시글 제목",
  "content": "게시글 내용",
  "status": "PUBLISHED"
}
```

| 필드 | 타입 | 필수 여부 | 설명 |
|------|------|-----------|------|
| title | string | 필수 | 게시글 제목 (최대 200자) |
| content | string | 필수 | 게시글 본문 |
| status | PostStatus | 선택 | 기본값: `PUBLISHED` |

**수용 기준:**

- Given: 인증된 사용자가 `post:write` 권한을 보유하고 있을 때
- When: `POST /api/v1/posts`에 유효한 title과 content를 포함하여 요청하면
- Then: 게시글이 생성되고 HTTP 201을 반환한다.

- Given: status를 지정하지 않은 요청일 때
- When: 게시글이 생성되면
- Then: status 기본값이 `PUBLISHED`로 설정된다.

- Given: `post:write` 권한이 없는 사용자일 때
- When: 게시글 작성을 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

- Given: 인증되지 않은 사용자일 때
- When: 게시글 작성을 시도하면
- Then: HTTP 401과 `AUTH_ERROR_001`을 반환한다.

---

#### FR-002: 게시글 단건 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-002 |
| **기능명** | 게시글 단건 조회 |
| **엔드포인트** | `GET /api/v1/posts/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | 본인 게시글만 조회 가능 |
| **응답 코드** | 200 OK |

**설명:**

인증된 사용자가 자신이 작성한 게시글을 ID로 조회합니다. 조회할 때마다 `viewCount`가 1 증가합니다. 타인의 게시글은 조회할 수 없으며, `userId` 조건으로 소유권을 검증합니다.

**수용 기준:**

- Given: 인증된 사용자가 본인 소유의 게시글 ID를 요청할 때
- When: `GET /api/v1/posts/:id`를 호출하면
- Then: 게시글 상세 정보를 반환하고 `viewCount`가 1 증가한다.

- Given: 존재하지 않는 게시글 ID를 요청할 때
- When: `GET /api/v1/posts/:id`를 호출하면
- Then: HTTP 404와 `POST_ERROR_001`을 반환한다.

- Given: 타인의 게시글 ID를 요청할 때
- When: `GET /api/v1/posts/:id`를 호출하면
- Then: HTTP 403과 `POST_ERROR_002`를 반환한다.

---

#### FR-003: 게시글 수정

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-003 |
| **기능명** | 게시글 수정 |
| **엔드포인트** | `PATCH /api/v1/posts/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | `post:write`, 본인 게시글만 수정 가능 |
| **응답 코드** | 204 No Content |

**설명:**

인증된 사용자가 자신이 작성한 게시글의 제목, 내용, 상태를 선택적으로 수정합니다. 수정 시 `updatedAt`과 `updatedBy`가 자동으로 갱신됩니다.

**요청 본문:**

```json
{
  "title": "수정된 제목",
  "content": "수정된 내용",
  "status": "DRAFT"
}
```

| 필드 | 타입 | 필수 여부 | 설명 |
|------|------|-----------|------|
| title | string | 선택 | 수정할 제목 (최대 200자) |
| content | string | 선택 | 수정할 본문 |
| status | PostStatus | 선택 | 수정할 상태값 |

**수용 기준:**

- Given: 인증된 사용자가 `post:write` 권한으로 본인 게시글을 수정할 때
- When: `PATCH /api/v1/posts/:id`에 수정 데이터를 전송하면
- Then: HTTP 204를 반환하고 게시글이 수정된다.

- Given: 수정 요청에 일부 필드만 포함될 때
- When: `PATCH /api/v1/posts/:id`를 호출하면
- Then: 제공된 필드만 선택적으로 수정된다.

- Given: `post:write` 권한이 없는 사용자일 때
- When: 게시글 수정을 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

---

#### FR-004: 게시글 삭제

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-004 |
| **기능명** | 게시글 삭제 (Soft Delete) |
| **엔드포인트** | `DELETE /api/v1/posts/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | `post:delete`, 본인 게시글만 삭제 가능 |
| **응답 코드** | 204 No Content |

**설명:**

인증된 사용자가 자신의 게시글을 삭제합니다. 물리적 삭제 대신 Soft Delete 방식으로 처리되어 `isDeleted: true`, `deletedAt`, `deletedBy`가 기록됩니다. 삭제된 게시글은 일반 조회에서 자동으로 제외됩니다.

**수용 기준:**

- Given: 인증된 사용자가 `post:delete` 권한으로 본인 게시글을 삭제할 때
- When: `DELETE /api/v1/posts/:id`를 호출하면
- Then: HTTP 204를 반환하고 `isDeleted: true`, `deletedAt`, `deletedBy`가 기록된다.

- Given: Soft Delete된 게시글을 이후에 조회할 때
- When: `GET /api/v1/posts/:id`를 호출하면
- Then: HTTP 404와 `POST_ERROR_001`을 반환한다.

- Given: `post:delete` 권한이 없는 사용자일 때
- When: 게시글 삭제를 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

---

#### FR-005: 전체 게시글 목록 조회 - Offset 페이지네이션

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-005 |
| **기능명** | 전체 게시글 목록 조회 (Offset) |
| **엔드포인트** | `GET /api/v1/posts/offset` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | 없음 (인증만 필요) |
| **응답 코드** | 200 OK |

**설명:**

페이지 번호 기반의 Offset 페이지네이션으로 전체 게시글 목록을 조회합니다. `findMany`와 `count`를 병렬 실행하여 응답 시간을 최소화합니다. 제목 및 상태로 필터링이 가능합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 여부 | 기본값 | 설명 |
|---------|------|-----------|--------|------|
| page | number | 필수 | 1 | 페이지 번호 |
| size | number | 필수 | - | 페이지당 항목 수 |
| order | string | 필수 | - | 정렬 기준 |
| title | string | 선택 | - | 제목 검색 필터 |
| status | PostStatus | 선택 | - | 상태 필터 |

**응답 형식:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "게시글 제목",
      "content": "게시글 내용",
      "status": "PUBLISHED",
      "viewCount": 10,
      "createdAt": "2026-03-15T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "totalCount": 50
  }
}
```

**수용 기준:**

- Given: 인증된 사용자가 유효한 page, size, order를 전달할 때
- When: `GET /api/v1/posts/offset`을 호출하면
- Then: 해당 페이지의 게시글 목록과 전체 개수(`totalCount`)를 반환한다.

- Given: title 필터를 포함한 요청일 때
- When: `GET /api/v1/posts/offset?title=검색어`를 호출하면
- Then: 제목에 검색어가 포함된 게시글만 반환한다.

- Given: Soft Delete된 게시글이 있을 때
- When: 목록을 조회하면
- Then: `isDeleted: true`인 게시글은 결과에 포함되지 않는다.

---

#### FR-006: 전체 게시글 목록 조회 - Cursor 페이지네이션

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-006 |
| **기능명** | 전체 게시글 목록 조회 (Cursor) |
| **엔드포인트** | `GET /api/v1/posts/cursor` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필요 |
| **권한** | 없음 (인증만 필요) |
| **응답 코드** | 200 OK |

**설명:**

커서 기반의 페이지네이션으로 전체 게시글 목록을 조회합니다. `size + 1`개를 조회하여 다음 페이지 존재 여부를 확인합니다. 무한 스크롤 UI에 적합하며 데이터 삽입/삭제 시에도 일관성이 보장됩니다. 상태 필터는 지원하지 않습니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 여부 | 기본값 | 설명 |
|---------|------|-----------|--------|------|
| lastCursor | number | 선택 | - | 마지막으로 조회한 게시글 ID |
| size | number | 필수 | - | 한 번에 가져올 항목 수 |
| order | string | 필수 | - | 정렬 기준 |
| title | string | 선택 | - | 제목 검색 필터 |

**응답 형식:**

```json
{
  "data": [...],
  "meta": {
    "nextCursor": 80
  }
}
```

**수용 기준:**

- Given: 인증된 사용자가 유효한 size와 order를 전달할 때
- When: `GET /api/v1/posts/cursor`를 호출하면
- Then: 지정한 size만큼의 게시글과 다음 페이지 커서(`nextCursor`)를 반환한다.

- Given: 마지막 페이지일 때
- When: 다음 페이지를 요청하면
- Then: `nextCursor`가 `null`로 반환된다.

- Given: lastCursor를 포함한 요청일 때
- When: `GET /api/v1/posts/cursor?lastCursor=80`을 호출하면
- Then: ID가 80 이후의 게시글 목록을 반환한다.

---

#### FR-007: 내 게시글 목록 조회 - Offset

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-007 |
| **기능명** | 내 게시글 목록 조회 (Offset) |
| **엔드포인트** | `GET /api/v1/users/me/posts/offset` |
| **우선순위** | P1 (중요) |
| **인증** | JWT Access Token 필요 |
| **응답 코드** | 200 OK |

**설명:**

현재 로그인한 사용자의 게시글만 Offset 페이지네이션으로 조회합니다. FR-005와 동일한 응답 형식을 사용하며, userId 조건이 자동으로 적용됩니다.

**수용 기준:**

- Given: 인증된 사용자가 내 게시글 목록을 요청할 때
- When: `GET /api/v1/users/me/posts/offset`을 호출하면
- Then: 본인이 작성한 게시글만 Offset 페이지네이션으로 반환한다.

---

#### FR-008: 내 게시글 목록 조회 - Cursor

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-008 |
| **기능명** | 내 게시글 목록 조회 (Cursor) |
| **엔드포인트** | `GET /api/v1/users/me/posts/cursor` |
| **우선순위** | P1 (중요) |
| **인증** | JWT Access Token 필요 |
| **응답 코드** | 200 OK |

**설명:**

현재 로그인한 사용자의 게시글만 Cursor 페이지네이션으로 조회합니다. FR-006과 동일한 응답 형식을 사용하며, userId 조건이 자동으로 적용됩니다.

**수용 기준:**

- Given: 인증된 사용자가 내 게시글 커서 목록을 요청할 때
- When: `GET /api/v1/users/me/posts/cursor`를 호출하면
- Then: 본인이 작성한 게시글만 Cursor 페이지네이션으로 반환한다.

---

### 4.2 Admin App 기능

---

#### FR-009: 관리자 전체 게시글 목록 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-009 |
| **기능명** | 관리자 전체 게시글 목록 조회 |
| **엔드포인트** | `GET /admin/api/v1/posts` |
| **우선순위** | P0 (필수) |
| **인증** | 관리자 JWT Access Token 필요 |
| **권한** | `post:read` |
| **응답 코드** | 200 OK |

**설명:**

관리자가 플랫폼의 모든 사용자 게시글을 Offset 페이지네이션으로 조회합니다. 제목, 사용자 ID, 상태로 필터링이 가능합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 여부 | 설명 |
|---------|------|-----------|------|
| page | number | 필수 | 페이지 번호 |
| size | number | 필수 | 페이지당 항목 수 |
| order | string | 필수 | 정렬 기준 |
| title | string | 선택 | 제목 검색 필터 |
| userId | number | 선택 | 특정 사용자의 게시글 필터 |
| status | PostStatus | 선택 | 상태 필터 |

**수용 기준:**

- Given: `post:read` 권한을 가진 관리자가 요청할 때
- When: `GET /admin/api/v1/posts`를 호출하면
- Then: 모든 사용자의 게시글 목록과 총 개수를 반환한다.

- Given: `post:read` 권한이 없는 관리자일 때
- When: 목록 조회를 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

---

#### FR-010: 관리자 게시글 상세 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-010 |
| **기능명** | 관리자 게시글 상세 조회 |
| **엔드포인트** | `GET /admin/api/v1/posts/:id` |
| **우선순위** | P0 (필수) |
| **인증** | 관리자 JWT Access Token 필요 |
| **권한** | `post:read` |
| **응답 코드** | 200 OK |

**설명:**

관리자가 특정 게시글의 상세 정보를 조회합니다. 모든 사용자의 게시글에 접근 가능합니다.

**수용 기준:**

- Given: `post:read` 권한을 가진 관리자가 유효한 게시글 ID로 요청할 때
- When: `GET /admin/api/v1/posts/:id`를 호출하면
- Then: 해당 게시글의 상세 정보를 반환한다.

- Given: 존재하지 않는 게시글 ID를 요청할 때
- When: 상세 조회를 시도하면
- Then: HTTP 404와 `POST_ERROR_001`을 반환한다.

---

#### FR-011: 관리자 게시글 상태 변경

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-011 |
| **기능명** | 관리자 게시글 상태 변경 |
| **엔드포인트** | `PATCH /admin/api/v1/posts/:id/status` |
| **우선순위** | P0 (필수) |
| **인증** | 관리자 JWT Access Token 필요 |
| **권한** | `post:update` |
| **응답 코드** | 204 No Content |

**설명:**

관리자가 게시글 상태를 `PUBLISHED`, `HIDDEN`, `DRAFT` 중 하나로 변경합니다. 부적절한 콘텐츠를 숨김 처리하거나 복원하는 데 활용됩니다.

**요청 본문:**

```json
{
  "status": "HIDDEN"
}
```

**수용 기준:**

- Given: `post:update` 권한을 가진 관리자가 유효한 상태값으로 요청할 때
- When: `PATCH /admin/api/v1/posts/:id/status`를 호출하면
- Then: HTTP 204를 반환하고 게시글 상태가 변경된다.

- Given: 유효하지 않은 status 값으로 요청할 때
- When: 상태 변경을 시도하면
- Then: HTTP 400을 반환한다.

- Given: `post:update` 권한이 없는 관리자일 때
- When: 상태 변경을 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

---

#### FR-012: 관리자 게시글 삭제

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-012 |
| **기능명** | 관리자 게시글 삭제 (Soft Delete) |
| **엔드포인트** | `DELETE /admin/api/v1/posts/:id` |
| **우선순위** | P0 (필수) |
| **인증** | 관리자 JWT Access Token 필요 |
| **권한** | `post:delete` |
| **응답 코드** | 204 No Content |

**설명:**

관리자가 모든 사용자의 게시글을 Soft Delete 방식으로 삭제합니다. `isDeleted: true`, `deletedAt`, `deletedBy`(관리자 ID)가 기록됩니다.

**수용 기준:**

- Given: `post:delete` 권한을 가진 관리자가 유효한 게시글 ID로 요청할 때
- When: `DELETE /admin/api/v1/posts/:id`를 호출하면
- Then: HTTP 204를 반환하고 `isDeleted: true`, `deletedAt`, `deletedBy`가 기록된다.

- Given: `post:delete` 권한이 없는 관리자일 때
- When: 삭제를 시도하면
- Then: HTTP 403과 `AUTH_ERROR_008`을 반환한다.

---

### 4.3 페이지네이션 방식 비교

| 항목 | Offset 페이지네이션 | Cursor 페이지네이션 |
|------|-------------------|-------------------|
| **성능** | 페이지 번호가 깊어질수록 느려짐 | 일정한 성능 유지 |
| **데이터 일관성** | 데이터 삽입/삭제 시 중복/누락 가능 | 일관성 보장 |
| **UI 적합성** | 페이지 번호 네비게이션 | 무한 스크롤 |
| **구현 방식** | `findMany` + `count` 병렬 실행 | `size+1` 조회로 다음 페이지 여부 확인 |
| **응답 메타** | `{ page, totalCount }` | `{ nextCursor }` |
| **전체 개수 제공** | 제공 | 미제공 |

---

### 4.4 게시글 상태 정의

| 상태 | 값 | 설명 | 공개 여부 |
|------|-----|------|-----------|
| 초안 | `DRAFT` | 작성 중인 게시글, 비공개 | 비공개 |
| 발행 | `PUBLISHED` | 게시된 게시글, 공개 | 공개 |
| 숨김 | `HIDDEN` | 숨김 처리된 게시글 | 비공개 |

---

## 5. 비기능 요구사항

### 5.1 성능 요구사항

| ID | 요구사항 | 목표값 |
|----|---------|--------|
| NFR-001 | 게시글 작성 API 응답 시간 | P95 200ms 이하 |
| NFR-002 | 게시글 단건 조회 API 응답 시간 | P95 100ms 이하 |
| NFR-003 | 게시글 목록 조회 API 응답 시간 | P95 300ms 이하 |
| NFR-004 | 동시 게시글 조회 처리 | 100 동시 요청 처리 가능 |
| NFR-005 | Offset 페이지네이션 쿼리 최적화 | `findMany`와 `count` 병렬 실행 |

### 5.2 보안 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-006 | 모든 게시글 API는 JWT Access Token 인증 필요 |
| NFR-007 | RBAC 기반 권한 검증: `post:write`, `post:delete`, `post:read`, `post:update` |
| NFR-008 | 사용자는 본인 소유의 게시글만 수정/삭제 가능 |
| NFR-009 | 관리자 API는 별도의 인증 체계 (`/admin/api/v1`) 적용 |
| NFR-010 | ValidationPipe의 whitelist + forbidNonWhitelisted로 불필요한 필드 차단 |

### 5.3 데이터 무결성 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-011 | 삭제는 Soft Delete로만 처리 (물리 삭제 금지) |
| NFR-012 | 모든 생성/수정/삭제에 감사 필드 자동 기록 (createdBy, updatedBy, deletedBy) |
| NFR-013 | 조회수 증가는 원자적(atomic) 연산으로 처리 (Prisma `increment`) |

### 5.4 확장성 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-014 | DB 인덱스를 통한 쿼리 최적화 (내 게시글: `[userId, status, isDeleted]`, 전체 목록: `[status, isDeleted, id]`) |
| NFR-015 | Cursor 페이지네이션으로 대규모 데이터셋에서도 일정한 성능 유지 |

### 5.5 가용성 요구사항

| ID | 요구사항 |
|----|---------|
| NFR-016 | 서비스 업타임 99.9% 이상 |
| NFR-017 | 게시글 조회 실패 시 적절한 에러 코드와 메시지 반환 |

---

## 6. 기술 요구사항 및 제약사항

### 6.1 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 11, TypeScript 5.7 |
| 데이터베이스 | PostgreSQL (스키마: `base.post`) |
| ORM | Prisma 7.2 + `@prisma/adapter-pg` |
| 인증 | Passport.js + JWT |
| 유효성 검증 | class-validator, class-transformer |
| API 문서 | Swagger (OpenAPI) |
| 패키지 관리 | pnpm workspace |

### 6.2 데이터 모델

**Post 테이블 (`base.post`):**

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Int | PK, Auto Increment | 게시글 고유 ID |
| title | String | varchar(200), NOT NULL | 게시글 제목 |
| content | String | Text, NOT NULL | 게시글 본문 |
| userId | Int | FK → base.user.id | 작성자 ID |
| viewCount | Int | Default: 0 | 조회수 |
| status | PostStatus | Default: PUBLISHED | 게시글 상태 |
| createdAt | DateTime | Default: now() | 생성 시각 |
| createdBy | Int? | - | 생성자 ID (CLS 자동 주입) |
| updatedAt | DateTime? | - | 수정 시각 |
| updatedBy | Int? | - | 수정자 ID |
| isDeleted | Boolean? | Default: false | Soft Delete 여부 |
| deletedAt | DateTime? | - | 삭제 시각 |
| deletedBy | Int? | - | 삭제자 ID |

**DB 인덱스:**

```
@@index([userId, status, isDeleted])    -- 내 게시글 조회 최적화
@@index([status, isDeleted, id])        -- 전체 목록 조회 + 정렬 최적화
```

**PostStatus Enum:**

```
DRAFT      -- 초안
PUBLISHED  -- 발행됨
HIDDEN     -- 숨김 처리
```

### 6.3 아키텍처 구조

레이어드 아키텍처를 따릅니다:

```
Controller  →  Service  →  Repository  →  Prisma (PostgreSQL)
```

- **Controller**: 라우팅, 데코레이터, 응답 래핑
- **Service**: 비즈니스 로직, 에러 처리, DTO 변환
- **Repository**: Prisma 쿼리, 감사 필드 자동 주입, 페이지네이션 처리

### 6.4 모듈 구조

```
apps/user/src/post/          -- User App 게시글 모듈
apps/admin/src/post/         -- Admin App 게시글 모듈
libs/prisma/src/             -- 공유 Prisma 서비스
libs/common/src/             -- 공유 가드, 데코레이터
```

### 6.5 API 버전 관리

URI 기반 버전 관리를 사용합니다.

```typescript
// User App
@Controller({ path: 'posts', version: '1' })
// 접근 경로: /api/v1/posts

// Admin App
@Controller({ path: 'posts', version: '1' })
// 접근 경로: /admin/api/v1/posts
```

### 6.6 통합 요구사항

| 시스템 | 연동 방식 | 목적 |
|--------|-----------|------|
| PostgreSQL | Prisma ORM | 게시글 데이터 영속성 |
| Redis | ioredis | 인증 토큰 관리 (직접 사용 없음) |
| CLS Middleware | AsyncLocalStorage | 감사 필드 자동 주입 |

---

## 7. 의존성 및 리스크

### 7.1 의존성

| 의존 대상 | 유형 | 설명 |
|-----------|------|------|
| 인증 시스템 (AuthModule) | 내부 | JWT 토큰 검증 및 사용자 ID 제공 |
| RBAC 시스템 (PermissionGuard) | 내부 | post:write, post:delete, post:read, post:update 권한 검증 |
| CLS Middleware | 내부 | createdBy, updatedBy, deletedBy 자동 주입 |
| PrismaService | 라이브러리 | 데이터베이스 쿼리 처리 |
| User 모듈 | 내부 | 사용자 존재 여부 확인 (userId 검증) |

### 7.2 리스크

| 리스크 | 심각도 | 발생 가능성 | 완화 방안 |
|--------|--------|-------------|-----------|
| Offset 페이지네이션 깊은 페이지 성능 저하 | 중간 | 높음 | 무한 스크롤 UX에는 Cursor 방식 권장, DB 인덱스 최적화 |
| viewCount 동시 업데이트 충돌 | 낮음 | 중간 | Prisma `increment` 원자적 연산으로 처리 |
| Soft Delete 데이터 누적으로 인한 쿼리 성능 저하 | 중간 | 낮음 | `isDeleted` 인덱스 포함, 장기적으로 아카이빙 정책 수립 |
| 권한 없는 게시글 접근 | 높음 | 낮음 | RBAC PermissionGuard + userId 소유권 검증 이중 적용 |
| 관리자 권한 오남용 | 높음 | 낮음 | RBAC 세분화, 관리자 액션 감사 로그 기록 |

### 7.3 가정사항

- 사용자는 게시글 작성 전 회원가입 및 로그인 절차를 완료한 상태입니다.
- RBAC 시드 데이터에서 USER 역할에 `post:write`, `post:delete` 권한이 기본 부여됩니다.
- 게시글 첨부 파일 기능은 이번 버전에서 제외됩니다.
- 게시글 공개 범위는 상태값(PUBLISHED/DRAFT/HIDDEN)으로만 제어됩니다.

---

## 8. 타임라인 및 마일스톤

### 8.1 구현 완료 현황

본 기능은 이미 구현 완료된 상태입니다.

| 마일스톤 | 상태 | 설명 |
|---------|------|------|
| M1: 게시글 CRUD 구현 | 완료 | User App 기본 CRUD 기능 |
| M2: 페이지네이션 구현 | 완료 | Offset/Cursor 두 가지 방식 |
| M3: Admin 관리 기능 구현 | 완료 | Admin App 게시글 관리 기능 |
| M4: RBAC 연동 | 완료 | PermissionGuard 적용 |
| M5: Soft Delete 구현 | 완료 | 감사 필드 자동 기록 |

### 8.2 향후 릴리즈 계획

| 버전 | 예상 일정 | 주요 기능 |
|------|-----------|-----------|
| v1.1 | 미정 | 댓글 기능 연동 |
| v1.2 | 미정 | 이미지 첨부 기능 |
| v2.0 | 미정 | 전문 검색 (Elasticsearch) |

---

## 9. 부록

### 9.1 에러 코드 정의

| 에러 코드 | HTTP 상태 | 메시지 | 발생 상황 |
|----------|-----------|--------|-----------|
| POST_ERROR_001 | 404 | 게시글을 찾을 수 없습니다 | 존재하지 않거나 삭제된 게시글 조회 시 |
| POST_ERROR_002 | 403 | 게시글에 대한 권한이 없습니다 | 타인의 게시글 접근 시 |
| AUTH_ERROR_001 | 401 | 인증 토큰을 찾을 수 없습니다 | Access Token 미제공 시 |
| AUTH_ERROR_008 | 403 | 리소스 접근 권한이 없습니다 | RBAC 권한 미보유 시 |

### 9.2 권한(Permission) 매핑

| 역할 | post:write | post:delete | post:read | post:update |
|------|-----------|-------------|-----------|-------------|
| SUPER_ADMIN | O | O | O | O |
| ADMIN | O | O | O | O |
| USER | O | O | - | - |
| PREMIUM_USER | O | O | - | - |

### 9.3 공통 응답 형식

```json
// 성공 (단건)
{ "data": { ... } }

// 성공 (Offset 페이지네이션)
{ "data": [...], "meta": { "page": 1, "totalCount": 50 } }

// 성공 (Cursor 페이지네이션)
{ "data": [...], "meta": { "nextCursor": 80 } }

// 에러
{
  "timestamp": "2026-03-15T00:00:00.000Z",
  "path": "/api/v1/posts/1",
  "status": 404,
  "code": "POST_ERROR_001",
  "message": "게시글을 찾을 수 없습니다"
}
```

### 9.4 용어 정의

| 용어 | 정의 |
|------|------|
| Soft Delete | 물리적으로 데이터를 삭제하지 않고 `isDeleted` 플래그로 삭제 처리하는 방식 |
| Offset 페이지네이션 | 페이지 번호와 크기를 기반으로 데이터를 건너뛰어 조회하는 방식 |
| Cursor 페이지네이션 | 마지막으로 조회한 항목의 ID(cursor)를 기준으로 다음 데이터를 조회하는 방식 |
| RBAC | Role-Based Access Control. 역할 기반 접근 제어 |
| CLS | Context-Local Storage. 요청 컨텍스트에 데이터를 저장하는 비동기 스토리지 |
| Audit Trail | 데이터 생성/수정/삭제 이력을 자동으로 기록하는 감사 추적 기능 |
| viewCount | 게시글 조회 횟수. 조회 API 호출 시 Prisma `increment`로 원자적 증가 |
| JWT | JSON Web Token. 인증 토큰 형식 |

### 9.5 참고 자료

| 문서 | 경로 |
|------|------|
| 게시글 기능 구현 문서 | `docs/implemented/게시글-기능.md` |
| API 엔드포인트 목록 | `docs/implemented/API-엔드포인트.md` |
| 데이터베이스 스키마 | `docs/implemented/데이터베이스-스키마.md` |
| 인증 및 인가 | `docs/implemented/인증-인가.md` |
| 설계 패턴 | `docs/implemented/설계-패턴.md` |
| 프로젝트 구조 | `docs/implemented/프로젝트-구조.md` |
| Swagger (User App) | `http://localhost:3000/api/docs` |
| Swagger (Admin App) | `http://localhost:3001/admin/api/docs` |

### 9.6 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2026-03-15 | 최초 작성 | 개발팀 |
