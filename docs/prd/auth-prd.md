# 인증 및 인가 시스템 PRD

## 문서 개요

| 항목 | 내용 |
|------|------|
| **문서 제목** | 인증 및 인가 시스템 PRD |
| **버전** | 1.0 |
| **작성일** | 2026-03-15 |
| **작성자** | 개발팀 |
| **상태** | 구현 완료 (문서화) |
| **대상 시스템** | NestJS 모노레포 (User App, Admin App) |

### 이해관계자

| 역할 | 관여 범위 |
|------|----------|
| 백엔드 개발팀 | 구현 및 유지보수 |
| 프론트엔드 개발팀 | 토큰 처리, API 연동 |
| 보안 담당자 | 인증 정책 검토 |
| 서비스 운영팀 | 장애 대응, 모니터링 |

---

## 배경 및 목적

### 문제 정의

NestJS 모노레포 환경에서 User App과 Admin App이 각각 독립적으로 운영되면서도 동일한 인증 인프라를 공유해야 하는 요구가 존재했다. 기존 단일 앱 구조로는 두 앱의 인증 도메인(일반 사용자 / 관리자)을 명확히 분리하기 어려웠다.

### 비즈니스 목표

1. **보안 강화**: JWT 기반 Stateless 인증에 Redis 이중 검증을 추가하여 토큰 탈취 위험 최소화
2. **운영 효율화**: 공통 인증 인프라를 `@libs/common`으로 중앙화하여 중복 코드 제거 및 일관성 확보
3. **확장성 확보**: RBAC 모델을 통해 향후 신규 역할 및 권한 추가 시 코드 변경 없이 DB 시드만으로 대응 가능
4. **남용 방지**: 비밀번호 재설정 등 민감 엔드포인트에 이중 Rate Limiting 적용

### 성공 지표

| 지표 | 목표값 |
|------|--------|
| 인증 API 응답 시간 (P95) | 200ms 이하 |
| 토큰 재발급 성공률 | 99.9% 이상 |
| 비인가 접근 차단율 | 100% |
| Rate Limiting 오탐률 | 1% 미만 |

---

## 사용자 및 이해관계자

### 타겟 사용자

| 페르소나 | 설명 | 주요 관심사 |
|----------|------|-------------|
| 일반 사용자 | 서비스를 이용하는 최종 사용자 | 빠른 로그인, 안전한 계정 보호 |
| 관리자 | 서비스 운영 및 콘텐츠 관리 담당자 | 안정적인 관리자 인증, 권한 제어 |
| 개발자 (소비자) | User App / Admin App을 개발하는 내부 팀 | 명확한 가드 인터페이스, 재사용 가능한 공통 모듈 |

### 사용자 스토리

| ID | 스토리 | 우선순위 |
|----|--------|----------|
| US-001 | 나는 일반 사용자로서, 이메일과 비밀번호로 로그인하여 서비스를 이용하고 싶다. | P0 |
| US-002 | 나는 일반 사용자로서, Access Token 만료 시 재로그인 없이 자동으로 토큰을 갱신받고 싶다. | P0 |
| US-003 | 나는 일반 사용자로서, 로그아웃 시 서버 측에서도 세션이 완전히 무효화되길 원한다. | P0 |
| US-004 | 나는 일반 사용자로서, 비밀번호를 분실했을 때 이메일과 휴대폰 번호로 본인 확인 후 재설정할 수 있어야 한다. | P0 |
| US-005 | 나는 관리자로서, loginId와 비밀번호로 관리자 대시보드에 로그인하고 싶다. | P0 |
| US-006 | 나는 관리자로서, 내 역할에 부여된 권한 범위 안에서만 리소스에 접근할 수 있어야 한다. | P1 |
| US-007 | 나는 개발자로서, 새로운 앱을 추가할 때 공통 인증 인프라를 재사용하여 빠르게 인증을 구현하고 싶다. | P1 |

---

## 제품 범위

### 포함 범위 (In Scope)

- JWT 기반 Access Token / Refresh Token 발급 및 검증
- User App 인증 (회원가입, 로그인, 로그아웃, 토큰 재발급)
- Admin App 인증 (로그인, 로그아웃, 토큰 재발급)
- 비밀번호 재설정 2단계 플로우 (이메일+휴대폰 검증 → 재설정)
- Refresh Token Rotation (일회용 갱신 전략)
- Redis + DB 이중 토큰 저장 및 검증
- RBAC (역할 기반 접근 제어): Role → Permission(scope:action) 구조
- Rate Limiting: IP 기반 및 이메일 기반 이중 제한
- 공통 인증 인프라 모듈화 (`@libs/common`)

### 제외 범위 (Out of Scope)

- OAuth 2.0 / 소셜 로그인 (Google, Kakao 등)
- 2단계 인증 (TOTP, SMS OTP)
- 세션 기반 인증
- 기기별 토큰 관리 (멀티 디바이스 개별 제어)
- 관리자 비밀번호 재설정

### 향후 고려사항

- 소셜 로그인 연동 (OAuth 2.0)
- 로그인 이력 조회 기능
- 의심 로그인 감지 및 알림
- IP 화이트리스트 기반 관리자 접근 제어

---

## 기능 요구사항

### FR-001: 회원가입

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-001 |
| **기능명** | 일반 사용자 회원가입 |
| **우선순위** | P0 |
| **엔드포인트** | `POST /api/v1/auth/signup` |
| **인증** | 불필요 (`@Public()`) |
| **응답 코드** | 201 Created |

**설명**

신규 사용자가 이메일, 비밀번호, 이름, 휴대폰 번호를 제출하면 계정을 생성한다. 이메일 중복 여부를 검사한 뒤 비밀번호를 bcrypt로 해싱하여 저장한다.

**처리 흐름**

```
이메일 중복 검사
  → 중복 시: USER_ERROR_003 (400) 반환
  → 고유 시: 비밀번호 bcrypt 해싱 → 사용자 생성 (status: ACTIVE)
```

**수용 기준 (Acceptance Criteria)**

| # | Given | When | Then |
|---|-------|------|------|
| AC-001-1 | 존재하지 않는 이메일 | 유효한 회원가입 요청 | 201 반환, DB에 사용자 생성됨 |
| AC-001-2 | 이미 등록된 이메일 | 동일 이메일로 재요청 | 400 반환, 코드: USER_ERROR_003 |
| AC-001-3 | 유효하지 않은 요청 본문 | 필수 필드 누락 요청 | 400 반환, 유효성 검증 에러 메시지 |

---

### FR-002: 로그인

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-002 |
| **기능명** | 일반 사용자 로그인 |
| **우선순위** | P0 |
| **엔드포인트** | `POST /api/v1/auth/signin` |
| **인증** | 불필요 (`@Public()`) |
| **응답 코드** | 200 OK |

**설명**

이메일과 비밀번호로 사용자를 인증하고 Access Token / Refresh Token 쌍을 발급한다. Refresh Token은 Redis와 DB에 이중 저장된다.

**처리 흐름**

```
이메일로 사용자 조회
  → 미존재 시: USER_ERROR_001 (404)
  → 탈퇴 회원: USER_ERROR_005 (400)
비밀번호 bcrypt 비교
  → 불일치 시: AUTH_ERROR_007 (401)
UUID JTI 생성
Access Token + Refresh Token 병렬 생성
Refresh Token → Redis(rt:{owner}:{ownerId}:{jti}) + DB(Token/TokenJwt) 저장
응답: { accessToken } + Refresh Token을 HTTP-Only 쿠키(웹) 또는 Authorization 헤더(앱)
```

**JWT Payload 구조**

```typescript
{
  id: number,        // 사용자 PK
  type: 'ac'|'re',   // Access / Refresh 구분
  aud: 'user',       // 대상
  jti: string,       // UUID (토큰 고유 식별자)
  issuer: 'monorepo'
}
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-002-1 | 등록된 사용자, 올바른 비밀번호 | 로그인 요청 | 200, accessToken 반환, Refresh Token 쿠키 설정 |
| AC-002-2 | 등록되지 않은 이메일 | 로그인 요청 | 404, USER_ERROR_001 |
| AC-002-3 | 올바른 이메일, 틀린 비밀번호 | 로그인 요청 | 401, AUTH_ERROR_007 |
| AC-002-4 | 탈퇴 처리된 사용자 | 로그인 요청 | 400, USER_ERROR_005 |
| AC-002-5 | 정상 로그인 후 | Redis 조회 | `rt:user:{id}:{jti}` 키로 해시된 Refresh Token 존재 |

---

### FR-003: 로그아웃

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-003 |
| **기능명** | 일반 사용자 로그아웃 |
| **우선순위** | P0 |
| **엔드포인트** | `DELETE /api/v1/auth/signout` |
| **인증** | Access Token 필요 (`JwtAccessGuard`) |
| **응답 코드** | 204 No Content |

**설명**

유효한 Refresh Token을 제출하면 해당 토큰을 Redis와 DB에서 삭제하여 서버 측에서 세션을 무효화한다. Redis/DB 삭제 실패는 `Promise.allSettled`로 부분 실패를 허용한다.

**처리 흐름**

```
Refresh Token 검증 (JwtRefreshGuard)
  → 실패 시: AUTH_ERROR_006 (401)
Redis(rt:{owner}:{ownerId}:{jti}) + DB(Token/TokenJwt) 토큰 삭제
  → Promise.allSettled 사용: 부분 실패 허용
204 반환
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-003-1 | 로그인된 사용자, 유효한 Refresh Token | 로그아웃 요청 | 204, Redis + DB에서 토큰 삭제 |
| AC-003-2 | Access Token 없는 요청 | 로그아웃 요청 | 401, AUTH_ERROR_001 |
| AC-003-3 | 만료된 Refresh Token | 로그아웃 요청 | 401, AUTH_ERROR_005 |

---

### FR-004: 토큰 재발급 (Refresh Token Rotation)

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-004 |
| **기능명** | Access Token 재발급 (Refresh Token Rotation) |
| **우선순위** | P0 |
| **엔드포인트** | `POST /api/v1/auth/token/refresh` |
| **인증** | Refresh Token (`JwtRefreshGuard`) |
| **응답 코드** | 200 OK |

**설명**

Refresh Token을 사용하여 새로운 Access Token / Refresh Token 쌍을 발급한다. 기존 Refresh Token은 일회용으로 즉시 폐기되며, 새 JTI로 새 토큰 쌍을 발급한다. Redis에 저장된 값과 비교 검증하여 토큰 재사용 공격을 방지한다.

**처리 흐름**

```
Refresh Token JWT 서명 검증
  → 실패: AUTH_ERROR_006 (401)
Redis에서 rt:{owner}:{ownerId}:{jti} 조회
  → 미존재: AUTH_ERROR_006 (401)
  → 해시 불일치: AUTH_ERROR_006 (401)
기존 토큰 Redis + DB 삭제
새 UUID JTI 생성
새 Access Token + Refresh Token 발급 및 Redis + DB 저장
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-004-1 | 유효한 Refresh Token | 토큰 재발급 요청 | 200, 새 accessToken 반환, 새 Refresh Token 쿠키 설정 |
| AC-004-2 | 이미 사용된 Refresh Token (폐기됨) | 재발급 요청 | 401, AUTH_ERROR_006 |
| AC-004-3 | 만료된 Refresh Token | 재발급 요청 | 401, AUTH_ERROR_005 |
| AC-004-4 | 정상 재발급 후 | 기존 JTI로 Redis 조회 | 해당 키 미존재 (일회용 폐기 확인) |

---

### FR-005: 비밀번호 재설정 요청

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-005 |
| **기능명** | 비밀번호 재설정 요청 (본인 확인) |
| **우선순위** | P0 |
| **엔드포인트** | `POST /api/v1/auth/password-reset/request` |
| **인증** | 불필요 (`@Public()`) |
| **응답 코드** | 200 OK |
| **Rate Limit** | IP 5회/5분 (`CustomThrottlerGuard`) + 이메일 5회/5분 (Redis INCR) |

**설명**

이메일과 휴대폰 번호를 사용하여 본인 확인 후 비밀번호 재설정용 단기 토큰(resetToken)을 발급한다. 남용 방지를 위해 IP 기반과 이메일 기반 이중 Rate Limiting이 적용된다.

**처리 흐름**

```
IP Rate Limit 검사 (CustomThrottlerGuard: 5회/5분)
  → 초과: AUTH_ERROR_015 (429)
이메일 기반 Rate Limit 검사
  → Redis INCR: password-reset:rate:{email} (5회/5분)
  → 초과: AUTH_ERROR_015 (429)
이메일 + 휴대폰 번호 DB 일치 검사
  → 불일치: USER_ERROR_004 (400)
UUID resetToken 생성
  → Redis 저장: password-reset:token:{token} → userId (TTL: 5분)
응답: { resetToken }
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-005-1 | 등록된 이메일 + 일치하는 휴대폰 번호 | 요청 | 200, resetToken 반환 (5분 유효) |
| AC-005-2 | 등록된 이메일 + 불일치 휴대폰 번호 | 요청 | 400, USER_ERROR_004 |
| AC-005-3 | 동일 IP에서 6회 연속 요청 | 6번째 요청 | 429, AUTH_ERROR_015 |
| AC-005-4 | 동일 이메일로 6회 연속 요청 | 6번째 요청 | 429, AUTH_ERROR_015 |
| AC-005-5 | 정상 발급 후 | Redis 조회 | `password-reset:token:{token}` 키로 userId 존재 |

---

### FR-006: 비밀번호 변경

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-006 |
| **기능명** | 비밀번호 변경 (재설정 완료) |
| **우선순위** | P0 |
| **엔드포인트** | `PATCH /api/v1/auth/password-reset` |
| **인증** | 불필요 (`@Public()`) |
| **응답 코드** | 204 No Content |

**설명**

FR-005에서 발급받은 resetToken과 새 비밀번호를 제출하여 비밀번호를 변경한다. 변경 완료 시 resetToken 무효화 및 해당 사용자의 모든 Refresh Token을 삭제하여 기존 세션을 전체 강제 종료한다.

**처리 흐름**

```
resetToken → Redis에서 userId 조회
  → 미존재 / 만료: AUTH_ERROR_009 (400)
새 비밀번호 bcrypt 해싱 → DB 업데이트
Redis에서 resetToken 키 삭제
해당 사용자의 모든 Refresh Token 삭제 (Redis + DB)
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-006-1 | 유효한 resetToken + 새 비밀번호 | 요청 | 204, 비밀번호 변경됨, 모든 세션 무효화 |
| AC-006-2 | 만료된 resetToken (5분 초과) | 요청 | 400, AUTH_ERROR_009 |
| AC-006-3 | 잘못된 resetToken | 요청 | 400, AUTH_ERROR_009 |
| AC-006-4 | 정상 변경 후 | 기존 Refresh Token으로 재발급 시도 | 401, AUTH_ERROR_006 |

---

### FR-007: 관리자 로그인

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-007 |
| **기능명** | 관리자 로그인 |
| **우선순위** | P0 |
| **엔드포인트** | `POST /admin/api/v1/auth/signin` |
| **인증** | 불필요 (`@Public()`) |
| **응답 코드** | 200 OK |

**설명**

관리자는 이메일이 아닌 `loginId` + 비밀번호로 인증한다. User App의 인증과 별도의 `AdminAuthModule`로 분리되어 있으나 동일한 공통 인프라(TokenService, CryptoService, 가드)를 사용한다. 발급 토큰의 `aud` 클레임은 `admin`으로 구분된다.

**처리 흐름**

```
loginId로 관리자 조회
  → 미존재 시: 인증 실패 반환
비밀번호 bcrypt 비교
  → 불일치 시: AUTH_ERROR_007 (401)
UUID JTI 생성
Access Token(aud: 'admin') + Refresh Token 병렬 생성
Refresh Token → Redis + DB 이중 저장
응답: { accessToken }
```

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-007-1 | 등록된 loginId, 올바른 비밀번호 | 로그인 요청 | 200, accessToken 반환 (`aud: 'admin'`) |
| AC-007-2 | 존재하지 않는 loginId | 로그인 요청 | 401 |
| AC-007-3 | Admin 토큰 | User App 보호 엔드포인트 접근 시도 | 401 (aud 불일치로 거부) |
| AC-007-4 | User 토큰 | Admin App 보호 엔드포인트 접근 시도 | 401 (aud 불일치로 거부) |

---

### FR-008: 관리자 로그아웃 및 토큰 재발급

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-008 |
| **기능명** | 관리자 로그아웃 및 토큰 재발급 |
| **우선순위** | P0 |
| **엔드포인트** | `DELETE /admin/api/v1/auth/signout`, `POST /admin/api/v1/auth/token/refresh` |
| **인증** | 엔드포인트별 상이 |
| **응답 코드** | 204 / 200 |

**설명**

FR-003(로그아웃), FR-004(Refresh Token Rotation)와 동일한 로직을 `aud: 'admin'` 컨텍스트로 수행한다. Admin App 전용 `AdminAuthModule`에서 처리하며, `@libs/common` 공통 인프라를 재사용한다.

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-008-1 | 로그인된 관리자 | 로그아웃 요청 | 204, Redis + DB에서 토큰 삭제 |
| AC-008-2 | 유효한 관리자 Refresh Token | 토큰 재발급 요청 | 200, 새 accessToken 반환 |
| AC-008-3 | 이미 사용된 관리자 Refresh Token | 재발급 요청 | 401, AUTH_ERROR_006 |

---

### FR-009: RBAC 권한 제어

| 항목 | 내용 |
|------|------|
| **기능 ID** | FR-009 |
| **기능명** | 역할 기반 접근 제어 (RBAC) |
| **우선순위** | P1 |
| **적용 방식** | `@Permission(scope, action)` + `@UseGuards(PermissionGuard)` |

**설명**

`User/Admin → UserRole/AdminRole → Role → RolePermission → Permission(scope, action)` 구조로 권한을 관리한다. `PermissionGuard`가 요청 시 JWT 페이로드에서 사용자 ID를 추출하여 DB에서 권한을 조회하고 허용 여부를 판단한다.

**권한 매트릭스**

| 역할 | scope:action | 적용 앱 |
|------|-------------|---------|
| USER | `post:write`, `post:delete` | User App |
| ADMIN | `user:read`, `user:update`, `user:delete` | Admin App |
| ADMIN | `post:read`, `post:update`, `post:delete` | Admin App |
| ADMIN | `notification:write`, `notification:read` | Admin App |
| SUPER_ADMIN | 모든 권한 | 전체 |

**시드 역할**

| 역할명 | 부여 권한 |
|--------|----------|
| SUPER_ADMIN | 모든 scope:action |
| ADMIN | user/post/notification 관련 read/write/update/delete |
| USER | post:write, post:delete |
| PREMIUM_USER | (추후 확장용) |

**수용 기준**

| # | Given | When | Then |
|---|-------|------|------|
| AC-009-1 | USER 역할 사용자 | `post:write` 권한 필요 엔드포인트 접근 | 201 성공 |
| AC-009-2 | USER 역할 사용자 | `user:read` 권한 필요 엔드포인트 접근 | 403, AUTH_ERROR_008 |
| AC-009-3 | SUPER_ADMIN 관리자 | 모든 엔드포인트 접근 | 성공 |
| AC-009-4 | 권한 미부여 관리자 | `notification:write` 엔드포인트 접근 | 403, AUTH_ERROR_008 |

---

## 비기능 요구사항

### NFR-001: 성능

| ID | 요구사항 |
|----|----------|
| NFR-001-1 | 로그인 API 응답 시간 P95 기준 200ms 이하 |
| NFR-001-2 | JwtAccessGuard 토큰 검증 10ms 이하 (Redis 미적중 시 DB 조회 포함 50ms 이하) |
| NFR-001-3 | 동시 인증 요청 1,000 TPS 이상 처리 가능 |
| NFR-001-4 | Access Token / Refresh Token 병렬 생성으로 발급 지연 최소화 |

### NFR-002: 보안

| ID | 요구사항 |
|----|----------|
| NFR-002-1 | 비밀번호 bcrypt 단방향 해싱 적용 (평문 저장 금지) |
| NFR-002-2 | Refresh Token bcrypt 해싱 후 Redis / DB 저장 (평문 저장 금지) |
| NFR-002-3 | Access Token TTL: 1시간 / Refresh Token TTL: 7일 |
| NFR-002-4 | Refresh Token은 웹 클라이언트에서 HTTP-Only 쿠키로 전달 (XSS 방지) |
| NFR-002-5 | JWT에 `jti`(UUID) 포함하여 토큰 고유성 보장 및 재사용 공격 방지 |
| NFR-002-6 | Refresh Token Rotation: 사용 즉시 폐기, 새 토큰 발급 |
| NFR-002-7 | 비밀번호 변경 시 해당 사용자의 모든 활성 세션 전체 강제 종료 |
| NFR-002-8 | User 토큰(`aud: 'user'`)과 Admin 토큰(`aud: 'admin'`) 상호 사용 불가 |
| NFR-002-9 | AES-256-CBC 대칭 암호화 유틸리티 제공 (CryptoService, 필요 시 활용) |

### NFR-003: 확장성

| ID | 요구사항 |
|----|----------|
| NFR-003-1 | Redis 기반 분산 Rate Limiting으로 수평 확장 시에도 일관된 제한 적용 |
| NFR-003-2 | 신규 앱 추가 시 `@libs/common` 공통 모듈 재사용으로 인증 구현 가능 |
| NFR-003-3 | RBAC 신규 역할/권한 추가는 DB 시드만으로 가능 (코드 변경 불필요) |

### NFR-004: 가용성

| ID | 요구사항 |
|----|----------|
| NFR-004-1 | Redis 연결 실패 시 재연결 전략: 최대 10회, 지연 `min(시도횟수 * 1000, 3000)ms` |
| NFR-004-2 | 토큰 삭제 시 `Promise.allSettled` 사용으로 Redis/DB 부분 실패 허용 (서비스 중단 방지) |
| NFR-004-3 | DB + Redis 헬스체크 엔드포인트 제공 (`GET /api/v1/health`, `GET /admin/api/v1/health`) |

### NFR-005: 감사 및 로깅

| ID | 요구사항 |
|----|----------|
| NFR-005-1 | 모든 요청에 대해 `{METHOD} {URL} {STATUS} {IP} {USER_AGENT}` 형식으로 로깅 (LoggerMiddleware) |
| NFR-005-2 | CLS를 통해 요청 컨텍스트(`userId`, `aud`, `clientIp`) 추적 (CustomClsMiddleware) |
| NFR-005-3 | DB 감사 필드 자동 입력: `createdBy`, `updatedBy`, `deletedBy` (CLS에서 자동 주입) |

---

## 기술 요구사항 및 제약사항

### 기술 스택

| 구분 | 기술 |
|------|------|
| 런타임 | Node.js (NestJS 프레임워크) |
| 인증 표준 | JWT (JSON Web Token) |
| 비밀번호 해싱 | bcrypt |
| 캐시 / Rate Limiting | Redis (ioredis 클라이언트) |
| 데이터베이스 | PostgreSQL (Prisma ORM, `@prisma/adapter-pg`) |
| 암호화 유틸리티 | AES-256-CBC (Node.js crypto 모듈) |
| JWT 전략 | `@nestjs/passport` + `passport-jwt` |

### 통합 요구사항

| 시스템 | 연동 내용 |
|--------|----------|
| Redis | Refresh Token 캐시, Rate Limiting 카운터, 비밀번호 재설정 토큰 저장 |
| PostgreSQL | 사용자/관리자 정보, 토큰 영속 저장, RBAC 권한 정보 |
| `@libs/common` (CommonModule) | User App / Admin App 공유 인증 인프라 (`@Global()` 모듈) |

### Redis 키 패턴

| 키 패턴 | 값 | TTL | 용도 |
|---------|-----|-----|------|
| `rt:{owner}:{ownerId}:{jti}` | bcrypt 해시된 Refresh Token | 7일 | 토큰 검증 캐시 |
| `{owner}:{ownerId}:tokens` | JTI 배열 (JSON) | 7일 | 전체 세션 삭제용 목록 |
| `password-reset:token:{token}` | userId | 5분 | 비밀번호 재설정 토큰 |
| `password-reset:rate:{email}` | 요청 횟수 (INCR) | 5분 | 이메일 기반 Rate Limiting |
| `throttler:{name}:{tracker}` | 요청 횟수 | 설정 TTL | IP/사용자 Rate Limiting |

### DB 토큰 모델

```
Token  { id, tokenHash, tokenType(JWT), owner(ADMIN|USER), ownerId, createdAt, ... }
TokenJwt { id, tokenId(FK→Token), jti }
```

### 기술적 제약사항

| 제약 | 설명 |
|------|------|
| 토큰 aud 분리 | User App과 Admin App의 JWT `aud` 클레임이 달라 상호 사용 불가. 가드에서 aud 불일치 시 401 반환 |
| Refresh Token 단방향 저장 | bcrypt 해시로만 저장. 검증은 `compare`로만 가능하며 평문 복원 불가 |
| Redis 의존성 | Rate Limiting 및 토큰 캐시가 Redis에 의존. Redis 장애 시 인증 성능 저하 가능 |
| DB 커넥션 풀 | Prisma `@prisma/adapter-pg` 커넥션 풀 최대 10으로 설정됨 |

---

## API 엔드포인트 명세

### User App (`/api/v1`)

| 메서드 | 경로 | 설명 | 인증 | Rate Limit | 응답 코드 |
|--------|------|------|------|------------|-----------|
| POST | `/auth/signup` | 회원가입 | 불필요 | - | 201 |
| POST | `/auth/signin` | 로그인 | 불필요 | - | 200 |
| DELETE | `/auth/signout` | 로그아웃 | Access Token | - | 204 |
| POST | `/auth/token/refresh` | 토큰 재발급 | Refresh Token | - | 200 |
| POST | `/auth/password-reset/request` | 비밀번호 재설정 요청 | 불필요 | IP 5/5분 + 이메일 5/5분 | 200 |
| PATCH | `/auth/password-reset` | 비밀번호 변경 | 불필요 | - | 204 |

### Admin App (`/admin/api/v1`)

| 메서드 | 경로 | 설명 | 인증 | 응답 코드 |
|--------|------|------|------|-----------|
| POST | `/auth/signin` | 관리자 로그인 | 불필요 | 200 |
| DELETE | `/auth/signout` | 관리자 로그아웃 | Access Token | 204 |
| POST | `/auth/token/refresh` | 관리자 토큰 재발급 | Refresh Token | 200 |

### 공통 응답 형식

```json
// 성공 (단건)
{ "data": { ... } }

// 에러
{
  "timestamp": "2026-03-15T00:00:00.000Z",
  "path": "/api/v1/auth/signin",
  "status": 401,
  "code": "AUTH_ERROR_007",
  "message": "비밀번호가 일치하지 않습니다"
}
```

---

## 에러 코드 명세

| 코드 | HTTP 상태 | 메시지 | 발생 시점 |
|------|-----------|--------|----------|
| AUTH_ERROR_001 | 401 | 인증 토큰을 찾을 수 없습니다 | Access Token 헤더 미포함 |
| AUTH_ERROR_002 | 401 | 리프레시 토큰을 찾을 수 없습니다 | Refresh Token 쿠키/헤더 미포함 |
| AUTH_ERROR_003 | 401 | 유효하지 않은 인증 토큰입니다 | JWT 서명 검증 실패 |
| AUTH_ERROR_004 | 401 | 인증 토큰이 만료되었습니다 | Access Token TTL 초과 |
| AUTH_ERROR_005 | 401 | 리프레시 토큰이 만료되었습니다 | Refresh Token TTL 초과 |
| AUTH_ERROR_006 | 401 | 유효하지 않은 리프레시 토큰입니다 | Redis 검증 실패 또는 이미 사용된 토큰 |
| AUTH_ERROR_007 | 401 | 비밀번호가 일치하지 않습니다 | bcrypt 비교 실패 |
| AUTH_ERROR_008 | 403 | 리소스 접근 권한이 없습니다 | RBAC 권한 부족 (PermissionGuard) |
| AUTH_ERROR_009 | 400 | 유효하지 않은 비밀번호 재설정 토큰입니다 | resetToken 만료 또는 미존재 |
| AUTH_ERROR_015 | 429 | 요청 횟수를 초과했습니다 | Rate Limit 초과 |
| USER_ERROR_001 | 404 | 회원 정보를 찾을 수 없습니다 | 이메일로 사용자 미조회 |
| USER_ERROR_003 | 400 | 이미 존재하는 이메일입니다 | 회원가입 시 이메일 중복 |
| USER_ERROR_004 | 400 | 회원 인증에 실패했습니다 | 이메일 + 휴대폰 번호 불일치 |
| USER_ERROR_005 | 400 | 이미 탈퇴한 회원입니다 | 탈퇴 사용자 로그인 시도 |

---

## 가드 및 인증 인프라

### 가드 목록

| 가드 | 적용 범위 | 역할 | 비고 |
|------|----------|------|------|
| `JwtAccessGuard` | 전역 (`APP_GUARD`) | Access Token 검증 | `@Public()` 데코레이터로 우회 가능 |
| `JwtRefreshGuard` | 토큰 재발급 엔드포인트 | Refresh Token 검증 | 쿠키 또는 Authorization 헤더에서 토큰 추출 |
| `PermissionGuard` | `@Permission()` 적용 엔드포인트 | RBAC scope:action 검사 | `@UseGuards(PermissionGuard)`와 함께 사용 |
| `CustomThrottlerGuard` | `@Throttle()` 적용 엔드포인트 | IP/사용자 기반 Rate Limiting | Redis INCR 원자적 카운팅 |

### `@libs/common` 제공 항목

| 항목 | 유형 | 설명 |
|------|------|------|
| `JwtAccessStrategy` | Passport Strategy | Access Token 검증 전략 |
| `JwtRefreshStrategy` | Passport Strategy | Refresh Token 검증 전략 |
| `TokenService` | Service | 토큰 생성/저장/삭제 |
| `CryptoService` | Service | bcrypt 해싱/비교, AES-256-CBC 암복호화 |
| `@Public()` | Decorator | JwtAccessGuard 인증 우회 마킹 |
| `@CurrentUser()` | Decorator | JWT 페이로드 파라미터 주입 |
| `@Permission(scope, action)` | Decorator | RBAC 권한 메타데이터 설정 |
| `LoggerMiddleware` | Middleware | 요청/응답 로깅 |
| `CustomClsMiddleware` | Middleware | 요청 컨텍스트 CLS 저장 |

---

## 의존성 및 리스크

### 의존성

| 의존 대상 | 유형 | 설명 |
|----------|------|------|
| Redis | 인프라 | Rate Limiting, 토큰 캐시, 비밀번호 재설정 토큰 저장 |
| PostgreSQL | 인프라 | 사용자/토큰/권한 영속 저장 |
| `@nestjs/passport` + `passport-jwt` | 라이브러리 | JWT 전략 구현 |
| `bcrypt` | 라이브러리 | 비밀번호 및 Refresh Token 해싱 |
| `ioredis` | 라이브러리 | Redis 클라이언트 |
| `@nestjs/throttler` | 라이브러리 | Rate Limiting 기반 |
| `nestjs-cls` | 라이브러리 | Continuation-Local Storage |

### 리스크 및 완화 전략

| 리스크 | 심각도 | 완화 전략 |
|--------|--------|----------|
| Redis 장애 시 Rate Limiting 불가 | 높음 | Redis 재연결 전략 (최대 10회), 헬스체크 모니터링 |
| Redis 장애 시 Refresh Token 검증 실패 | 높음 | `Promise.allSettled`로 부분 실패 허용, DB 폴백 가능 구조 유지 |
| JWT Secret 키 노출 | 매우 높음 | 환경변수 분리, 비밀 관리 시스템(Vault 등) 도입 권고 |
| Refresh Token 탈취 및 재사용 | 높음 | Rotation 전략으로 재사용 즉시 감지 및 무효화 |
| bcrypt 해싱 비용으로 인한 로그인 지연 | 중간 | cost factor 적절히 설정, 성능 모니터링 |
| DB 커넥션 풀 고갈 (max 10) | 중간 | 트래픽 증가에 따른 커넥션 풀 크기 조정 필요 |

### 가정사항

1. Redis는 항상 인증 서버와 동일한 VPC 내에 위치하여 낮은 지연으로 접근 가능하다.
2. JWT Secret은 환경변수로 관리되며 앱 재시작 없이는 변경되지 않는다.
3. 모바일 클라이언트는 Refresh Token을 Authorization 헤더로 전달하는 방식을 지원한다.
4. 비밀번호 재설정 resetToken은 응답으로 클라이언트에 직접 전달되며, 별도 이메일 발송은 이번 범위에 포함되지 않는다.

---

## 타임라인 및 마일스톤

> 본 문서는 이미 구현 완료된 기능을 기반으로 작성된 사후 문서(Retrospective PRD)입니다.

| 마일스톤 | 내용 | 상태 |
|----------|------|------|
| M1 | User App 기본 인증 (회원가입/로그인/로그아웃, JWT 발급) | 완료 |
| M2 | Refresh Token Rotation, Redis 이중 저장 | 완료 |
| M3 | Admin App 독립 AuthModule, loginId 기반 인증 | 완료 |
| M4 | RBAC Role/Permission 모델, PermissionGuard | 완료 |
| M5 | 비밀번호 재설정 2단계 플로우, 이중 Rate Limiting | 완료 |
| M6 | `@libs/common` 공통 모듈화, 인프라 공유 구조 확립 | 완료 |

---

## 부록

### 용어 정의

| 용어 | 정의 |
|------|------|
| JWT | JSON Web Token. Header.Payload.Signature 형식의 자기 완결형 토큰 |
| JTI | JWT ID. 토큰의 고유 식별자 (UUID). 재사용 방지에 활용 |
| aud | JWT Audience. 토큰의 대상 시스템 식별자 (`user` 또는 `admin`) |
| Access Token | 짧은 유효기간(1시간)의 API 인증용 토큰. 응답 Body로 전달 |
| Refresh Token | 긴 유효기간(7일)의 토큰 갱신용 토큰. HTTP-Only 쿠키 또는 헤더로 전달 |
| Refresh Token Rotation | Refresh Token 사용 시 즉시 폐기하고 새 토큰을 발급하는 보안 전략 |
| RBAC | Role-Based Access Control. 역할에 권한을 부여하고 사용자에게 역할을 할당하는 접근 제어 모델 |
| Rate Limiting | 단위 시간 내 요청 횟수를 제한하는 남용 방지 메커니즘 |
| CLS | Continuation-Local Storage. 비동기 컨텍스트에서 요청별 데이터를 전파하는 Node.js 메커니즘 |
| bcrypt | 단방향 해시 함수. 비밀번호 및 Refresh Token 해싱에 사용 |
| HTTP-Only 쿠키 | JavaScript로 접근 불가한 쿠키. XSS 공격으로부터 토큰 보호 |
| resetToken | 비밀번호 재설정 전용 단기(5분) 토큰. UUID 형식 |

### 참고 자료

| 문서 | 경로 |
|------|------|
| 인증/인가 구현 명세 | `docs/implemented/인증-인가.md` |
| API 엔드포인트 명세 | `docs/implemented/API-엔드포인트.md` |
| 데이터베이스 스키마 | `docs/implemented/데이터베이스-스키마.md` |
| 공통 라이브러리 명세 | `docs/implemented/공통-라이브러리.md` |

### 변경 이력

| 버전 | 날짜 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 1.0 | 2026-03-15 | 최초 작성 (구현 완료 기능 기반 사후 문서화) | 개발팀 |
