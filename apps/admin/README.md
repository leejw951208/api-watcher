# Admin Application

관리자용 REST API 서버입니다.

## 개요

- **포트**: 3000 (로컬) / 3001 (Docker)
- **API 문서**: `http://localhost:3000/admin/api/docs` (로컬)
- **API 버전**: v1

## 모듈 구조

```
src/
├── main.ts                 # 애플리케이션 엔트리포인트
├── app.module.ts           # 루트 모듈
├── configs/                # 앱 설정
│   └── swagger.config.ts
└── v1/                     # API v1 모듈
    └── notification/       # 알림 관리 모듈
```

## API 엔드포인트

### Notification (`/api/v1/notifications`)

| Method | Endpoint | 설명                    | 인증 |
| ------ | -------- | ----------------------- | ---- |
| POST   | `/`      | 알림 발송               | O    |
| GET    | `/`      | 알림 목록 조회 (Offset) | O    |

## 실행 방법

```bash
# 개발 환경 실행
yarn start:local:admin

# 디버그 모드
yarn start:debug

# 빌드
yarn build:admin
```

## 테스트

```bash
# 단위 테스트
yarn test:admin

# E2E 테스트
yarn test:e2e

# 커버리지
yarn test:cov
```

## 인증 방식

User 앱과 동일한 JWT 기반 인증을 사용합니다.

- Access Token: Bearer 토큰
- Refresh Token: 쿠키 또는 헤더

## 권한 관리

관리자 앱은 Role 기반 권한 관리를 지원합니다:

- `SUPER_ADMIN`: 최고 관리자
- `ADMIN`: 일반 관리자

## 의존성

- `@libs/common` - 공통 유틸리티, 가드, 데코레이터
- `@libs/prisma` - Prisma 클라이언트, 데이터베이스 서비스

## 확장 예정 기능

- 사용자 관리 (User CRUD)
- 게시글 관리 (Post CRUD)
- 권한/역할 관리 (Role & Permission)
- 대시보드 통계
