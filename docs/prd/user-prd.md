# 사용자 관리 PRD

## 문서 개요

| 항목 | 내용 |
|------|------|
| **문서 제목** | 사용자 관리 기능 PRD |
| **버전** | 1.0 |
| **작성일** | 2026-03-15 |
| **작성자** | 개발팀 |
| **상태** | 구현 완료 |
| **이해관계자** | 백엔드 개발팀, 프론트엔드 개발팀, QA팀, 서비스 기획팀 |

---

## 1. 배경 및 목적

### 1.1 문제 정의

서비스를 이용하는 사용자는 자신의 계정 정보를 직접 관리할 수 있어야 하며, 관리자는 전체 사용자의 상태를 모니터링하고 운영 정책에 따라 계정을 제어할 수 있어야 한다. 두 가지 요구사항을 분리된 앱(User App, Admin App)에서 각각 처리함으로써 권한 경계를 명확히 하고 보안을 강화한다.

### 1.2 비즈니스 목표

- 사용자에게 자율적인 계정 관리 수단을 제공하여 서비스 신뢰도를 높인다.
- 관리자가 악성 사용자 계정을 신속하게 비활성화하거나 삭제할 수 있도록 하여 서비스 안전성을 유지한다.
- Soft Delete 방식으로 탈퇴 데이터를 보존하여 향후 분석 및 규정 준수 요건에 대응한다.

### 1.3 성공 지표 (KPI)

| 지표 | 목표 |
|------|------|
| 내 정보 조회 API 응답 시간 | 200ms 이하 (P95) |
| 관리자 사용자 목록 조회 응답 시간 | 300ms 이하 (P95) |
| 권한 없는 접근 차단율 | 100% |
| 탈퇴 후 재탈퇴 방지 정확도 | 100% |

---

## 2. 사용자 및 이해관계자

### 2.1 타겟 사용자

| 사용자 유형 | 설명 | 진입 앱 |
|-------------|------|---------|
| 일반 사용자 | 서비스에 가입한 인증된 회원 | User App |
| 관리자 | RBAC 권한을 가진 내부 운영자 | Admin App |

### 2.2 사용자 스토리

**일반 사용자 (User App)**

- US-001: 나는 인증된 사용자로서, 현재 내 계정 정보(이메일, 이름, 전화번호, 상태)를 확인하기 위해 내 프로필 조회 기능을 원한다.
- US-002: 나는 인증된 사용자로서, 이메일 또는 전화번호를 변경하기 위해 내 정보 수정 기능을 원한다.
- US-003: 나는 인증된 사용자로서, 서비스 탈퇴를 원할 때 회원 탈퇴 기능을 원한다.

**관리자 (Admin App)**

- US-004: 나는 관리자로서, 전체 사용자 현황을 파악하기 위해 검색/필터링이 가능한 사용자 목록 조회 기능을 원한다.
- US-005: 나는 관리자로서, 특정 사용자의 상세 정보를 확인하기 위해 사용자 상세 조회 기능을 원한다.
- US-006: 나는 관리자로서, 문제 사용자를 제어하기 위해 사용자 상태 변경(ACTIVE/INACTIVE/WITHDRAWN) 기능을 원한다.
- US-007: 나는 관리자로서, 탈퇴 처리가 필요한 사용자를 삭제하기 위해 Soft Delete 기능을 원한다.

### 2.3 이해관계자 요구사항

| 이해관계자 | 요구사항 |
|------------|----------|
| 서비스 기획팀 | 탈퇴 데이터 보존 (규정 준수, 데이터 분석) |
| 보안팀 | 민감 필드(password) 응답 노출 금지, RBAC 권한 제어 |
| QA팀 | 에러 코드 명세 및 예외 처리 일관성 |

---

## 3. 제품 범위

### 3.1 포함 범위 (In Scope)

- User App: 인증된 사용자의 내 정보 조회, 수정, 회원 탈퇴
- Admin App: 사용자 목록 조회(Offset 페이지네이션), 사용자 상세 조회, 상태 변경, Soft Delete
- RBAC 권한 검사 (Admin App 전 엔드포인트)
- Rate Limiting (내 정보 조회: IP/User 각 5회/분)
- Soft Delete 방식 데이터 보존

### 3.2 제외 범위 (Out of Scope)

- 사용자 비밀번호 직접 변경 (별도 비밀번호 재설정 기능에서 처리)
- 사용자 회원가입 (인증 모듈에서 처리)
- Hard Delete (물리적 데이터 삭제)
- 탈퇴 사용자 복구 기능
- 사용자 역할(Role) 직접 변경

### 3.3 향후 고려사항

- 탈퇴 사용자 계정 복구 기능
- 관리자의 사용자 직접 생성 기능
- 사용자 활동 이력 조회
- 대량 상태 변경 (Bulk Update)

---

## 4. 기능 요구사항

### 4.1 User App — 내 정보 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-001 |
| **기능명** | 내 정보 조회 |
| **엔드포인트** | `GET /api/v1/users/me` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 |
| **Rate Limit** | IP 기준 5회/분, User 기준 5회/분 |

**설명**

JWT 페이로드에서 추출한 사용자 ID(`payload.id`)로 DB를 조회하여 프로필 정보를 반환한다. `plainToInstance` + `excludeExtraneousValues: true` 옵션을 사용하여 password 등 민감 필드를 응답에서 자동 제외한다.

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 사용자 PK |
| `email` | string | 이메일 |
| `name` | string | 이름 |
| `phone` | string | 전화번호 |
| `status` | UserStatus | 계정 상태 (ACTIVE / INACTIVE / WITHDRAWN) |
| `createdAt` | Date | 가입일 |
| `updatedAt` | Date | 최종 수정일 |

**수용 기준**

- Given: 유효한 Access Token을 가진 사용자가
- When: `GET /api/v1/users/me` 요청 시
- Then: 해당 사용자의 프로필 정보를 HTTP 200으로 반환하며, password 필드는 포함되지 않는다.

- Given: 동일 사용자가 1분 내 6회 이상 요청 시
- When: 6번째 요청이 도달하면
- Then: HTTP 429 Too Many Requests를 반환한다.

- Given: 유효하지 않은 Access Token으로 요청 시
- When: Guard가 토큰 검증 실패를 감지하면
- Then: HTTP 401 Unauthorized를 반환한다.

---

### 4.2 User App — 내 정보 수정

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-002 |
| **기능명** | 내 정보 수정 |
| **엔드포인트** | `PATCH /api/v1/users/me` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 |
| **Rate Limit** | 없음 (전역 기본값 적용: IP/User 10,000회/분) |

**설명**

인증된 사용자가 자신의 이메일 또는 전화번호를 수정한다. 수정 가능한 필드는 `email`과 `phone`으로 제한된다.

**요청 필드**

| 필드 | 타입 | 필수 여부 | 설명 |
|------|------|-----------|------|
| `email` | string | 선택 | 변경할 이메일 주소 |
| `phone` | string | 선택 | 변경할 전화번호 |

**수용 기준**

- Given: 유효한 Access Token을 가진 사용자가
- When: 유효한 email 또는 phone 값을 body에 담아 `PATCH /api/v1/users/me` 요청 시
- Then: HTTP 204 No Content를 반환하며 DB에 변경 사항이 반영된다.

- Given: 존재하지 않는 사용자 ID로 요청 시 (비정상 케이스)
- When: Repository에서 사용자를 찾지 못하면
- Then: HTTP 404와 USER_ERROR_001 에러 코드를 반환한다.

---

### 4.3 User App — 회원 탈퇴

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-003 |
| **기능명** | 회원 탈퇴 (Soft Delete) |
| **엔드포인트** | `DELETE /api/v1/users/me` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 |
| **Rate Limit** | 없음 (전역 기본값 적용) |

**설명**

인증된 사용자가 회원 탈퇴를 요청한다. 물리적 삭제 없이 Soft Delete 방식으로 처리하며, `status=WITHDRAWN`, `isDeleted=true`, `deletedAt`, `deletedBy` 값을 설정한다. 이미 탈퇴 처리된 사용자의 재탈퇴 요청은 차단한다.

**수용 기준**

- Given: 정상 활성 상태(ACTIVE)의 인증된 사용자가
- When: `DELETE /api/v1/users/me` 요청 시
- Then: HTTP 204 No Content를 반환하며, DB에서 해당 사용자의 `status=WITHDRAWN`, `isDeleted=true`, `deletedAt=현재시각`으로 갱신된다.

- Given: 이미 탈퇴 처리된 사용자(isDeleted=true)가
- When: 다시 `DELETE /api/v1/users/me` 요청 시
- Then: HTTP 400과 USER_ERROR_005(이미 탈퇴한 회원) 에러 코드를 반환한다.

---

### 4.4 Admin App — 사용자 목록 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-004 |
| **기능명** | 사용자 목록 조회 (Offset 페이지네이션) |
| **엔드포인트** | `GET /admin/api/v1/users` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 (Admin) |
| **권한** | `user:read` |

**설명**

관리자가 전체 사용자 목록을 Offset 페이지네이션 방식으로 조회한다. 이름, 이메일, 상태 조건으로 필터링할 수 있으며, `isDeleted=false` 조건으로 삭제된 사용자는 기본적으로 제외된다.

**요청 파라미터 (Query)**

| 파라미터 | 타입 | 필수 여부 | 설명 |
|----------|------|-----------|------|
| `page` | number | 필수 | 페이지 번호 (1부터 시작) |
| `size` | number | 필수 | 페이지당 항목 수 |
| `order` | string | 선택 | 정렬 방향 (asc / desc, 기본값: desc) |
| `name` | string | 선택 | 이름 부분 일치 검색 |
| `email` | string | 선택 | 이메일 부분 일치 검색 |
| `status` | UserStatus | 선택 | 상태 필터 (ACTIVE / INACTIVE / WITHDRAWN) |

**응답 구조**

```
{
  data: AdminUserResponseDto[],
  meta: {
    page: number,
    totalCount: number
  }
}
```

**수용 기준**

- Given: `user:read` 권한을 가진 관리자가
- When: `GET /admin/api/v1/users?page=1&size=20` 요청 시
- Then: HTTP 200과 함께 사용자 목록 및 페이지 메타 정보를 반환한다.

- Given: `user:read` 권한이 없는 관리자가
- When: 동일 요청 시
- Then: HTTP 403 Forbidden을 반환한다.

- Given: `status=ACTIVE` 필터를 적용한 요청 시
- When: 쿼리가 실행되면
- Then: `status=ACTIVE`인 사용자만 포함된 결과를 반환한다.

---

### 4.5 Admin App — 사용자 상세 조회

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-005 |
| **기능명** | 사용자 상세 조회 |
| **엔드포인트** | `GET /admin/api/v1/users/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 (Admin) |
| **권한** | `user:read` |

**설명**

관리자가 특정 사용자의 상세 정보를 조회한다. 경로 파라미터 `:id`는 정수 타입으로 검증된다(`ParseIntPipe`).

**수용 기준**

- Given: `user:read` 권한을 가진 관리자가
- When: `GET /admin/api/v1/users/1` 요청 시
- Then: HTTP 200과 함께 해당 사용자의 상세 정보를 반환한다.

- Given: 존재하지 않는 사용자 ID로 요청 시
- When: Repository에서 사용자를 찾지 못하면
- Then: HTTP 404와 USER_ERROR_001 에러 코드를 반환한다.

---

### 4.6 Admin App — 사용자 상태 변경

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-006 |
| **기능명** | 사용자 상태 변경 |
| **엔드포인트** | `PATCH /admin/api/v1/users/:id/status` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 (Admin) |
| **권한** | `user:update` |

**설명**

관리자가 특정 사용자의 상태를 ACTIVE, INACTIVE, WITHDRAWN 중 하나로 변경한다. 변경 시 `updatedAt`, `updatedBy` 감사 필드가 자동으로 갱신된다.

**요청 Body**

| 필드 | 타입 | 필수 여부 | 설명 |
|------|------|-----------|------|
| `status` | UserStatus | 필수 | 변경할 상태 (ACTIVE / INACTIVE / WITHDRAWN) |

**수용 기준**

- Given: `user:update` 권한을 가진 관리자가
- When: `PATCH /admin/api/v1/users/1/status` 요청에 `{"status": "INACTIVE"}` body를 포함하면
- Then: HTTP 204 No Content를 반환하며, 해당 사용자의 상태가 INACTIVE로 변경된다.

- Given: 존재하지 않는 사용자 ID로 요청 시
- When: Repository에서 사용자를 찾지 못하면
- Then: HTTP 404와 USER_ERROR_001 에러 코드를 반환한다.

- Given: UserStatus enum에 정의되지 않은 값을 body에 전달 시
- When: ValidationPipe가 유효성 검증을 수행하면
- Then: HTTP 400 Bad Request를 반환한다.

---

### 4.7 Admin App — 사용자 삭제

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-007 |
| **기능명** | 사용자 Soft Delete |
| **엔드포인트** | `DELETE /admin/api/v1/users/:id` |
| **우선순위** | P0 (필수) |
| **인증** | JWT Access Token 필수 (Admin) |
| **권한** | `user:delete` |

**설명**

관리자가 특정 사용자를 Soft Delete 처리한다. `status=WITHDRAWN`, `isDeleted=true`, `deletedAt`, `deletedBy` 값을 설정하며, 데이터는 물리적으로 삭제되지 않는다.

**수용 기준**

- Given: `user:delete` 권한을 가진 관리자가
- When: `DELETE /admin/api/v1/users/1` 요청 시
- Then: HTTP 204 No Content를 반환하며, 해당 사용자의 `isDeleted=true`, `status=WITHDRAWN`으로 갱신된다.

- Given: 존재하지 않는 사용자 ID로 요청 시
- When: Repository에서 사용자를 찾지 못하면
- Then: HTTP 404와 USER_ERROR_001 에러 코드를 반환한다.

---

## 5. 비기능 요구사항

### 5.1 성능

| ID | 요구사항 |
|----|----------|
| NFR-001 | 내 정보 조회 API: P95 응답 시간 200ms 이하 |
| NFR-002 | 관리자 사용자 목록 조회: P95 응답 시간 300ms 이하 |
| NFR-003 | DB 조회는 `isDeleted` 컬럼 인덱스를 활용하여 풀스캔 방지 |

### 5.2 보안

| ID | 요구사항 |
|----|----------|
| NFR-004 | 모든 엔드포인트는 `JwtAccessGuard`를 통한 Access Token 검증 필수 |
| NFR-005 | Admin App의 모든 사용자 관리 엔드포인트는 `PermissionGuard`를 통한 RBAC 권한 검사 필수 |
| NFR-006 | 응답 시 `excludeExtraneousValues: true` 옵션으로 password 등 민감 필드를 자동 제외 |
| NFR-007 | User App은 자신의 데이터에만 접근 가능 (JWT payload.id 기반 자기 자신 조회) |
| NFR-008 | 감사 필드(`createdBy`, `updatedBy`, `deletedBy`)는 CLS를 통해 자동 주입 |

### 5.3 Rate Limiting

| ID | 요구사항 |
|----|----------|
| NFR-009 | `GET /api/v1/users/me`: IP 기준 5회/분, User 기준 5회/분 (Redis 기반 분산 처리) |
| NFR-010 | Rate Limit 초과 시 HTTP 429 Too Many Requests 반환 |

### 5.4 가용성

| ID | 요구사항 |
|----|----------|
| NFR-011 | 서비스 업타임 99.9% 이상 |
| NFR-012 | Redis 연결 실패 시 최대 10회 재연결 시도 (지수 백오프 방식) |

### 5.5 데이터 무결성

| ID | 요구사항 |
|----|----------|
| NFR-013 | 탈퇴 처리는 Soft Delete 방식으로 원본 데이터 보존 |
| NFR-014 | `isDeleted=false` 필터를 모든 조회 쿼리에 기본 적용하여 삭제된 사용자를 조회 결과에서 제외 |

---

## 6. 기술 요구사항 및 제약사항

### 6.1 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 11, TypeScript 5.7 |
| 데이터베이스 | PostgreSQL + Prisma 7.2 |
| 캐시 (Rate Limit) | Redis (ioredis) |
| 인증 | Passport.js + JWT (Access Token: 1시간, Refresh Token: 7일) |
| 유효성 검증 | class-validator, class-transformer |
| API 문서 | Swagger (OpenAPI) |

### 6.2 데이터 모델

**User 테이블** (`base.user` 스키마)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK) | 자동 증가 기본 키 |
| `email` | String (unique) | 이메일 (로그인 ID) |
| `password` | String | bcrypt 해시된 비밀번호 |
| `name` | String | 이름 |
| `phone` | String | 전화번호 |
| `status` | UserStatus | 계정 상태 (기본값: ACTIVE) |
| `createdAt` | DateTime | 생성일 |
| `createdBy` | Int? | 생성자 ID |
| `updatedAt` | DateTime? | 수정일 |
| `updatedBy` | Int? | 수정자 ID |
| `isDeleted` | Boolean | Soft Delete 여부 (기본값: false) |
| `deletedAt` | DateTime? | 삭제일 |
| `deletedBy` | Int? | 삭제자 ID |

**UserStatus Enum**

| 값 | 설명 |
|----|------|
| `ACTIVE` | 정상 활성 상태 |
| `INACTIVE` | 비활성 (관리자 설정) |
| `WITHDRAWN` | 탈퇴 처리됨 |

### 6.3 Repository 메서드

**UserRepository (User App)**

| 메서드 | 시그니처 | 설명 |
|--------|----------|------|
| `findById` | `(id: number): Promise<User \| null>` | ID로 조회 (`isDeleted: false` 조건 포함) |
| `findByEmail` | `(email: string): Promise<User \| null>` | 이메일로 조회 |
| `findByEmailAndPhone` | `(email: string, phone: string): Promise<User \| null>` | 이메일+전화번호로 조회 (비밀번호 재설정용) |
| `existsByEmail` | `(email: string): Promise<boolean>` | 이메일 중복 확인 |
| `create` | `(data: CreateUserData): Promise<User>` | 사용자 생성 |
| `update` | `(id: number, data: UpdateUserData): Promise<User>` | 정보 수정 (email, phone) |
| `updatePassword` | `(id: number, hash: string): Promise<User>` | 비밀번호 변경 |
| `softDelete` | `(id: number): Promise<User>` | Soft Delete (WITHDRAWN 처리) |

**AdminUserRepository (Admin App)**

| 메서드 | 시그니처 | 설명 |
|--------|----------|------|
| `findById` | `(id: number): Promise<User \| null>` | ID로 조회 (`isDeleted: false`) |
| `findUsersOffset` | `(dto: AdminUserPaginationRequestDto): Promise<AdminUserOffsetResponse>` | Offset 페이지네이션 조회 |
| `updateStatus` | `(id: number, status: UserStatus): Promise<User>` | 상태 변경 |
| `softDelete` | `(id: number): Promise<User>` | Soft Delete (WITHDRAWN 처리) |

### 6.4 통합 요구사항

| 시스템 | 연동 목적 | 비고 |
|--------|-----------|------|
| `@libs/common` | 공통 가드, 데코레이터, 예외 처리, DTO | `@Global()` 모듈로 자동 주입 |
| `@libs/prisma` | DB 접근 (PrismaService, User, UserStatus) | `@Global()` 모듈로 자동 주입 |
| Redis | Rate Limiting 카운팅 | `CustomThrottlerGuard` 내부 사용 |
| CLS (nestjs-cls) | 감사 필드 자동 주입 | `CustomClsMiddleware`가 요청마다 컨텍스트 설정 |

### 6.5 API 버전 관리

- URI 기반 버전 관리: `/api/v1/...` (User App), `/admin/api/v1/...` (Admin App)
- `defaultVersion: '1'` 설정으로 버전 생략 시 v1 적용

---

## 7. 에러 코드 명세

| 에러 코드 | HTTP 상태 | 설명 | 발생 시나리오 |
|-----------|-----------|------|--------------|
| USER_ERROR_001 | 404 | 회원 정보 없음 | 존재하지 않는 사용자 ID로 조회/수정/삭제 요청 시 |
| USER_ERROR_003 | 400 | 이미 존재하는 이메일 | 회원가입 또는 이메일 변경 시 중복 이메일 감지 |
| USER_ERROR_004 | 400 | 회원 인증 실패 | 비밀번호 재설정 시 이메일+전화번호 불일치 |
| USER_ERROR_005 | 400 | 이미 탈퇴한 회원 | 탈퇴 처리된 사용자(isDeleted=true)의 재탈퇴 요청 |

---

## 8. API 엔드포인트 요약

### 8.1 User App

| 메서드 | 엔드포인트 | 기능 | 인증 | Rate Limit | 응답 코드 |
|--------|-----------|------|------|------------|-----------|
| GET | `/api/v1/users/me` | 내 정보 조회 | Access Token | 5회/분 (IP, User) | 200 |
| PATCH | `/api/v1/users/me` | 내 정보 수정 | Access Token | - | 204 |
| DELETE | `/api/v1/users/me` | 회원 탈퇴 | Access Token | - | 204 |

### 8.2 Admin App

| 메서드 | 엔드포인트 | 기능 | 권한 | 응답 코드 |
|--------|-----------|------|------|-----------|
| GET | `/admin/api/v1/users` | 사용자 목록 조회 | `user:read` | 200 |
| GET | `/admin/api/v1/users/:id` | 사용자 상세 조회 | `user:read` | 200 |
| PATCH | `/admin/api/v1/users/:id/status` | 상태 변경 | `user:update` | 204 |
| DELETE | `/admin/api/v1/users/:id` | Soft Delete | `user:delete` | 204 |

---

## 9. 의존성 및 리스크

### 9.1 의존성

| 의존성 | 유형 | 설명 |
|--------|------|------|
| `CommonModule` | 내부 라이브러리 | 가드, 예외 처리, Rate Limiting 등 공통 기능 |
| `PrismaModule` | 내부 라이브러리 | DB 접근 및 User 모델 정의 |
| Redis | 외부 인프라 | Rate Limiting 분산 카운팅 |
| PostgreSQL | 외부 인프라 | 사용자 데이터 영속성 |
| JWT 인증 | 공통 모듈 의존 | Access Token 검증 및 사용자 ID 추출 |
| RBAC 권한 | 공통 모듈 의존 | Admin App 권한 검사 (PermissionGuard) |

### 9.2 리스크 및 완화 방안

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|-----------|
| Redis 장애 시 Rate Limiting 동작 불가 | 중간 | Redis 재연결 전략(최대 10회) 적용, 장애 시 에러 로깅 |
| 탈퇴 사용자의 Refresh Token 미삭제 | 높음 | 탈퇴 처리 시 관련 Refresh Token 일괄 무효화 로직 추가 검토 필요 |
| 대량 사용자 목록 조회 시 성능 저하 | 낮음 | Offset 페이지네이션 적용, `isDeleted` 인덱스 활용 |
| 관리자 권한 남용 | 높음 | RBAC 권한 세분화(user:read/update/delete), 감사 로그(`updatedBy`) 기록 |

### 9.3 가정사항

- 사용자는 이미 회원가입(인증 모듈)을 완료한 상태이다.
- Access Token은 요청 시 Authorization 헤더(`Bearer {token}`)로 전달된다.
- 관리자 계정 및 역할(Role)은 시드 데이터 또는 별도 관리자 생성 프로세스를 통해 사전 설정된다.
- DB 스키마 마이그레이션은 Prisma Migrate를 통해 관리된다.

---

## 10. 타임라인 및 마일스톤

| 마일스톤 | 내용 | 상태 |
|----------|------|------|
| M1: 설계 완료 | DB 스키마, API 설계, DTO 정의 | 완료 |
| M2: User App 구현 | FR-001, FR-002, FR-003 구현 | 완료 |
| M3: Admin App 구현 | FR-004, FR-005, FR-006, FR-007 구현 | 완료 |
| M4: 테스트 | 단위 테스트, E2E 테스트 | 완료 |
| M5: 문서화 | Swagger API 문서, 구현 문서 | 완료 |

---

## 11. 부록

### 11.1 용어 정의

| 용어 | 정의 |
|------|------|
| Soft Delete | 데이터를 물리적으로 삭제하지 않고 `isDeleted=true`, `deletedAt` 등 플래그를 설정하여 논리적으로 삭제 처리하는 방식 |
| RBAC | Role-Based Access Control. 역할 기반 접근 제어. 사용자의 역할에 따라 리소스 접근 권한을 부여하는 방식 |
| Rate Limiting | 일정 시간 내 요청 횟수를 제한하여 서비스 남용을 방지하는 기법 |
| JWT | JSON Web Token. 인증 및 권한 부여에 사용되는 토큰 형식 |
| Access Token | 단기 인증 토큰 (TTL: 1시간). API 요청 시 Authorization 헤더에 포함 |
| Offset Pagination | 페이지 번호와 페이지 크기로 데이터를 조회하는 페이지네이션 방식 |
| CLS | Context Local Storage. 요청별 컨텍스트 데이터(사용자 ID 등)를 저장하는 저장소 |
| Expose | class-transformer의 `@Expose()` 데코레이터. `excludeExtraneousValues: true` 옵션과 함께 사용 시 해당 필드만 직렬화 |

### 11.2 참고 자료

| 문서 | 경로 | 설명 |
|------|------|------|
| 인증 및 인가 문서 | `docs/implemented/인증-인가.md` | JWT 인증 흐름, RBAC 구조 |
| 데이터베이스 스키마 | `docs/implemented/데이터베이스-스키마.md` | User 모델, Enum 정의 |
| 공통 라이브러리 | `docs/implemented/공통-라이브러리.md` | 가드, Rate Limiting, 예외 처리 |
| 프로젝트 구조 | `docs/implemented/프로젝트-구조.md` | 모노레포 구조, 기술 스택 |
| Swagger (User App) | `GET /api/docs` | User App API 명세 |
| Swagger (Admin App) | `GET /admin/api/docs` | Admin App API 명세 |

### 11.3 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 1.0 | 2026-03-15 | 최초 작성 (구현 완료 기준) | 개발팀 |
