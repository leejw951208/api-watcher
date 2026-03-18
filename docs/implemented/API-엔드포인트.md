# API 엔드포인트

## User App (`/api/v1`)

### Auth (`/auth`)

| 메서드 | 경로 | 설명 | 인증 | Rate Limit | 상태 코드 |
|--------|------|------|------|------------|-----------|
| POST | `/auth/signup` | 회원가입 | 불필요 | - | 201 |
| POST | `/auth/signin` | 로그인 | 불필요 | - | 200 |
| DELETE | `/auth/signout` | 로그아웃 | 필요 | - | 204 |
| POST | `/auth/token/refresh` | 토큰 재발급 | Refresh Token | - | 200 |
| POST | `/auth/password-reset/request` | 비밀번호 재설정 요청 (이메일+휴대폰 검증) | 불필요 | IP 5회/5분 + 이메일 5회/5분 | 200 |
| PATCH | `/auth/password-reset` | 비밀번호 변경 | 불필요 | - | 204 |

### Users/Me (`/users/me`)

| 메서드 | 경로 | 설명 | Rate Limit | 상태 코드 |
|--------|------|------|------------|-----------|
| GET | `/users/me` | 내 정보 조회 | 5/분 (IP, User) | 200 |
| PATCH | `/users/me` | 내 정보 수정 | - | 204 |
| DELETE | `/users/me` | 회원 탈퇴 | - | 204 |
| GET | `/users/me/posts/offset` | 내 게시글 (Offset) | - | 200 |
| GET | `/users/me/posts/cursor` | 내 게시글 (Cursor) | - | 200 |
| GET | `/users/me/notifications/cursor` | 내 알림 목록 (Cursor) | - | 200 |
| PATCH | `/users/me/notifications/read-all` | 전체 알림 읽음 처리 | - | 204 |

### Posts (`/posts`)

| 메서드 | 경로 | 설명 | Permission | 상태 코드 |
|--------|------|------|------------|-----------|
| GET | `/posts/offset` | 전체 게시글 (Offset) | - | 200 |
| GET | `/posts/cursor` | 전체 게시글 (Cursor) | - | 200 |
| GET | `/posts/:id` | 게시글 조회 (조회수 증가) | - | 200 |
| POST | `/posts` | 게시글 작성 | `post:write` | 201 |
| PATCH | `/posts/:id` | 게시글 수정 | `post:write` | 204 |
| DELETE | `/posts/:id` | 게시글 삭제 | `post:delete` | 204 |

### Notifications (`/notifications`)

| 메서드 | 경로 | 설명 | 상태 코드 |
|--------|------|------|-----------|
| GET | `/notifications/:id` | 알림 상세 조회 | 200 |
| PATCH | `/notifications/:id` | 알림 읽음 처리 | 204 |
| DELETE | `/notifications/:id` | 알림 삭제 | 204 |

### Health

| 메서드 | 경로 | 설명 | 인증 | 상태 코드 |
|--------|------|------|------|-----------|
| GET | `/health` | DB + Redis 상태 확인 | 불필요 | 200 |

---

## Admin App (`/admin/api/v1`)

### Auth (`/auth`)

| 메서드 | 경로 | 설명 | 인증 | 상태 코드 |
|--------|------|------|------|-----------|
| POST | `/auth/signin` | 관리자 로그인 (loginId) | 불필요 | 200 |
| DELETE | `/auth/signout` | 관리자 로그아웃 | 필요 | 204 |
| POST | `/auth/token/refresh` | 토큰 재발급 | Refresh Token | 200 |

### Users (`/users`)

| 메서드 | 경로 | 설명 | Permission | 상태 코드 |
|--------|------|------|------------|-----------|
| GET | `/users` | 사용자 목록 조회 | `user:read` | 200 |
| GET | `/users/:id` | 사용자 상세 조회 | `user:read` | 200 |
| PATCH | `/users/:id/status` | 사용자 상태 변경 (Body: `{ status }`) | `user:update` | 204 |
| DELETE | `/users/:id` | 사용자 삭제 | `user:delete` | 204 |

### Posts (`/posts`)

| 메서드 | 경로 | 설명 | Permission | 상태 코드 |
|--------|------|------|------------|-----------|
| GET | `/posts` | 게시글 목록 조회 | `post:read` | 200 |
| GET | `/posts/:id` | 게시글 상세 조회 | `post:read` | 200 |
| PATCH | `/posts/:id/status` | 게시글 상태 변경 (Body: `{ status }`) | `post:update` | 204 |
| DELETE | `/posts/:id` | 게시글 삭제 | `post:delete` | 204 |

### Notifications

| 메서드 | 경로 | 설명 | Permission | 상태 코드 |
|--------|------|------|------------|-----------|
| POST | `/notifications` | 알림 발송 | `notification:write` | 201 |
| GET | `/notifications` | 알림 목록 조회 | `notification:read` | 200 |

### Health

| 메서드 | 경로 | 설명 | 인증 | 상태 코드 |
|--------|------|------|------|-----------|
| GET | `/health` | DB + Redis 상태 확인 | 불필요 | 200 |

---

## 에러 코드

| 코드 | 상태 | 메시지 |
|------|------|--------|
| AUTH_ERROR_001 | 401 | 인증 토큰을 찾을 수 없습니다 |
| AUTH_ERROR_002 | 401 | 리프레시 토큰을 찾을 수 없습니다 |
| AUTH_ERROR_003 | 401 | 유효하지 않은 인증 토큰입니다 |
| AUTH_ERROR_004 | 401 | 인증 토큰이 만료되었습니다 |
| AUTH_ERROR_005 | 401 | 리프레시 토큰이 만료되었습니다 |
| AUTH_ERROR_006 | 401 | 유효하지 않은 리프레시 토큰입니다 |
| AUTH_ERROR_007 | 401 | 비밀번호가 일치하지 않습니다 |
| AUTH_ERROR_008 | 403 | 리소스 접근 권한이 없습니다 |
| AUTH_ERROR_009 | 400 | 유효하지 않은 비밀번호 재설정 토큰입니다 |
| AUTH_ERROR_010 | 429 | 요청 횟수를 초과했습니다 |
| USER_ERROR_001 | 404 | 회원 정보를 찾을 수 없습니다 |
| USER_ERROR_003 | 400 | 이미 존재하는 이메일입니다 |
| USER_ERROR_004 | 400 | 회원 인증에 실패했습니다 (이메일+휴대폰 불일치) |
| USER_ERROR_005 | 400 | 이미 탈퇴한 회원입니다 |
| POST_ERROR_001 | 404 | 게시글을 찾을 수 없습니다 |
| POST_ERROR_002 | 403 | 게시글에 대한 권한이 없습니다 |
| NOTIFICATION_ERROR_001 | 404 | 알림을 찾을 수 없습니다 |
| THROTTLER_ERROR_001 | 400 | 요청 횟수를 초과했습니다 |

## 공통 응답 형식

```json
// 성공 (단건)
{ "data": { ... } }

// 성공 (Offset 페이지네이션)
{ "data": [...], "meta": { "page": 1, "totalCount": 50 } }

// 성공 (Cursor 페이지네이션)
{ "data": [...], "meta": { "nextCursor": 80 } }

// 에러
{ "timestamp": "...", "path": "...", "status": 401, "code": "AUTH_ERROR_003", "message": "..." }
```
