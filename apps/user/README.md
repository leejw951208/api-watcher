# User Application

사용자용 REST API 서버입니다.

## 개요

- **포트**: 3000
- **API 문서**: `http://localhost:3000/api/docs`
- **API 버전**: v1

## 모듈 구조

```
src/
├── main.ts                 # 애플리케이션 엔트리포인트
├── app.module.ts           # 루트 모듈
├── configs/                # 앱 설정
│   └── swagger.config.ts
└── v1/                     # API v1 모듈
    ├── auth/               # 인증 모듈
    ├── user/               # 사용자 모듈
    ├── post/               # 게시글 모듈
    └── notification/       # 알림 모듈
```

## API 엔드포인트

### Auth (`/api/v1`)

| Method | Endpoint                  | 설명                      | 인증          |
| ------ | ------------------------- | ------------------------- | ------------- |
| POST   | `/signup`                 | 회원가입                  | X             |
| POST   | `/signin`                 | 로그인                    | X             |
| DELETE | `/signout`                | 로그아웃                  | O             |
| POST   | `/token/refresh`          | 토큰 재발급               | Refresh Token |
| POST   | `/password-reset/request` | 비밀번호 재설정 코드 발급 | X             |
| POST   | `/password-reset/verify`  | 비밀번호 재설정 코드 확인 | X             |
| PATCH  | `/password-reset`         | 비밀번호 재설정           | X             |

### User (`/api/v1/users`)

| Method | Endpoint | 설명         | 인증 |
| ------ | -------- | ------------ | ---- |
| GET    | `/me`    | 내 정보 조회 | O    |
| PATCH  | `/me`    | 내 정보 수정 | O    |
| DELETE | `/me`    | 회원 탈퇴    | O    |

### Post (`/api/v1/posts`)

| Method | Endpoint     | 설명                      | 인증 |
| ------ | ------------ | ------------------------- | ---- |
| GET    | `/:id`       | 게시글 상세 조회          | O    |
| GET    | `/me/offset` | 내 게시글 목록 (Offset)   | O    |
| GET    | `/offset`    | 전체 게시글 목록 (Offset) | O    |
| POST   | `/`          | 게시글 작성               | O    |
| PATCH  | `/:id`       | 게시글 수정               | O    |
| DELETE | `/:id`       | 게시글 삭제               | O    |

### Notification (`/api/v1/notifications`)

| Method | Endpoint     | 설명                  | 인증 |
| ------ | ------------ | --------------------- | ---- |
| GET    | `/me/cursor` | 내 알림 목록 (Cursor) | O    |
| GET    | `/:id`       | 알림 상세 조회        | O    |
| PATCH  | `/:id`       | 알림 읽음 처리        | O    |
| PATCH  | `/read-all`  | 전체 알림 읽음 처리   | O    |
| DELETE | `/:id`       | 알림 삭제             | O    |

## 실행 방법

```bash
# 개발 환경 실행
yarn start:local:user

# 디버그 모드
yarn start:debug

# 빌드
yarn build:user
```

## 테스트

```bash
# 단위 테스트
yarn test:user

# E2E 테스트
yarn test:e2e

# 커버리지
yarn test:cov
```

## 인증 방식

### Access Token

- Bearer 토큰 방식
- 헤더: `Authorization: Bearer {token}`
- 만료 시간: 환경 변수로 설정

### Refresh Token

- **웹**: HTTP-only 쿠키에 저장
- **앱**: Authorization 헤더로 전달
- 만료 시간: 환경 변수로 설정

## 의존성

- `@libs/common` - 공통 유틸리티, 가드, 데코레이터
- `@libs/prisma` - Prisma 클라이언트, 데이터베이스 서비스
