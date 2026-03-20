# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어 및 커뮤니케이션 규칙

- **기본 응답 언어**: 한국어
- **코드 주석**: 한국어로 작성
- **커밋 메시지**: 한국어로 작성
- **문서화**: 한국어로 작성
- **변수명/함수명**: 영어 (코드 표준 준수)

---

## 프로젝트 개요

NestJS CLI 기반 모노레포 스타터킷. 두 개의 독립 앱(User API, Admin API)과 두 개의 공유 라이브러리(@libs/common, @libs/prisma)로 구성됩니다.

- **패키지 매니저**: pnpm
- **런타임**: Node.js 22.16.0+
- **데이터베이스**: PostgreSQL 15+ (Prisma ORM)
- **캐시**: Redis (ioredis)

---

## 주요 명령어

### 개발 서버 실행

```bash
pnpm start:local:user   # User 앱 (watch 모드)
pnpm start:local:admin  # Admin 앱 (watch 모드)
```

두 앱을 동시에 로컬에서 실행하면 포트 충돌(3000)이 발생합니다. Docker를 사용하면 User는 3000, Admin은 3001 포트로 분리됩니다.

### 빌드

```bash
pnpm build             # 전체 빌드 (user + admin)
pnpm build:user
pnpm build:admin
```

### 테스트

```bash
pnpm test              # 전체 테스트
pnpm test:user         # User 앱 테스트만
pnpm test:admin        # Admin 앱 테스트만
pnpm test:watch        # Watch 모드
pnpm test:cov          # 커버리지 리포트
```

`pre-push` Husky 훅이 `pnpm test`를 자동 실행합니다.

### 코드 품질

```bash
pnpm lint              # ESLint 자동 수정
pnpm format            # Prettier 포매팅
```

### 데이터베이스

```bash
pnpm db:generate       # Prisma 클라이언트 생성
pnpm db:migrate        # 마이그레이션 실행
pnpm db:reset          # DB 초기화
pnpm db:seed:run       # 시드 데이터 삽입
```

### Docker

```bash
docker compose up -d --build         # 전체 실행
docker compose up -d user --build    # User 앱만
docker compose up -d admin --build   # Admin 앱만
```

---

## 아키텍처

### 모노레포 구조

```
apps/
  user/    # 일반 사용자 REST API (포트 3000, 프리픽스: /api)
  admin/   # 관리자 REST API (포트 3001, 프리픽스: /admin)
libs/
  common/  # 공통 유틸리티 (@libs/common)
  prisma/  # Prisma ORM 설정 (@libs/prisma)
envs/      # 공통 환경변수 (.env.local, .env.prod)
```

### @libs/common의 주요 구성

- `guard/` — JWT Access/Refresh Guard, Permission Guard
- `strategy/` — Passport JWT 전략 (Access/Refresh)
- `decorator/` — 커스텀 데코레이터 (API 가드, JWT 페이로드, 권한)
- `exception/` — BaseException, GlobalExceptionHandler
- `middleware/` — Logger, CLS (Context-Local Storage)
- `service/` — CryptoService, TokenService
- `dto/` — 공통 응답 DTO, 페이지네이션 DTO
- `redis/` — Redis 모듈
- `throttler/` — 요청 제한 모듈
- `config/` — 공통 환경변수 스키마, Swagger, Winston 설정

### @libs/prisma의 주요 구성

- `prisma.service.ts` — PrismaClient 래퍼
- `generated/` — Prisma 자동 생성 클라이언트 (직접 수정 금지)
- `configs/scripts/` — DB 마이그레이션·시딩 스크립트

### 환경변수 로드 순서

1. `envs/.env.{NODE_ENV}` (공통)
2. `apps/{app}/envs/.env.{NODE_ENV}` (앱 전용)
3. `ConfigModule`의 `load` 함수로 객체 변환
4. Joi 스키마(`validate`)로 검증

---

## 코드 컨벤션

### Prettier 설정

- Single quotes: `true`
- Trailing comma: `none`
- Print width: `140`
- Tab width: `4`
- Semicolons: `false`

### ESLint 주요 규칙

- `prisma.client`를 통해서만 PrismaClient에 접근 (직접 import 금지)
- TypeScript ESLint 권장 설정 + Prettier 통합

### API 문서

- Swagger는 `@libs/common/config/swagger` 설정을 사용
- User: `http://localhost:3000/api/v1/docs`
- Admin: `http://localhost:3000/admin/v1/docs`

---

## 경로 별칭

`tsconfig.json`에 정의된 경로 별칭:

- `@libs/common/*` → `libs/common/src/*`
- `@libs/prisma/*` → `libs/prisma/src/*`

`jest.config.js`의 `moduleNameMapper`도 동일한 별칭을 사용합니다.
