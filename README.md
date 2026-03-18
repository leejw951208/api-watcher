# API Watcher

사용자가 등록한 API 엔드포인트를 주기적으로 호출하여 오류 발생 시 슬랙 또는 이메일로 알림을 보내주는 모니터링 서비스입니다.

## ✨ 주요 기능

- **API 등록**: 엔드포인트 URL, HTTP 메소드, 요청 바디, 인증 토큰(선택) 등 모니터링에 필요한 정보 등록
- **주기적 호출**: 등록된 API를 설정된 주기마다 자동 호출
- **오류 감지**: HTTP 상태 코드, 응답 시간 등을 기반으로 오류 여부 판별
- **알림 발송**: 오류 감지 시 슬랙 또는 이메일로 즉시 알림

---

## 📋 요구사항

- Node.js 22.16.0 이상
- PostgreSQL 15.0 이상
- Redis

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd api-watcher
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. Prisma 클라이언트 생성 및 마이그레이션

```bash
pnpm db:generate
pnpm db:migrate
```

### 4. 애플리케이션 실행

```bash
# User API (포트 3000)
pnpm start:local:user

# Admin API (포트 3001)
pnpm start:local:admin
```

> **주의**: 두 앱을 동시에 로컬에서 실행하면 포트 충돌이 발생합니다. Docker를 사용하면 포트가 자동으로 분리됩니다.

### 5. Docker 실행

```bash
# 전체 애플리케이션 실행
# --build: 도커 이미지 새로 빌드
docker compose up -d --build

# 특정 애플리케이션 실행
# APP = api | admin
docker compose up -d {APP} --build
```

## 📚 API 문서

- **Swagger UI**:
    - User API: `http://localhost:3000/api/v1/docs`
    - Admin API: `http://localhost:3001/admin/v1/docs`

## 🗂️ 프로젝트 구조

```
apps/
  user/    # 일반 사용자 REST API (포트 3000, 프리픽스: /api)
  admin/   # 관리자 REST API (포트 3001, 프리픽스: /admin)
libs/
  common/  # 공통 유틸리티 (@libs/common)
  prisma/  # Prisma ORM 설정 (@libs/prisma)
envs/      # 공통 환경변수 (.env.local, .env.prod)
```

## 🛠️ 주요 명령어

### 개발

```bash
pnpm start:local:user   # User 앱 실행 (watch 모드)
pnpm start:local:admin  # Admin 앱 실행 (watch 모드)
```

### 빌드

```bash
pnpm build        # 전체 빌드 (user + admin)
pnpm build:user
pnpm build:admin
```

### 테스트

```bash
pnpm test         # 전체 테스트
pnpm test:user    # User 앱 테스트만
pnpm test:admin   # Admin 앱 테스트만
pnpm test:watch   # Watch 모드
pnpm test:cov     # 커버리지 리포트
```

### 코드 품질

```bash
pnpm lint         # ESLint 자동 수정
pnpm format       # Prettier 포매팅
```

### 데이터베이스

```bash
pnpm db:generate       # Prisma 클라이언트 생성
pnpm db:migrate        # 마이그레이션 실행
pnpm db:migrate:create # 새 마이그레이션 생성
pnpm db:reset          # DB 초기화
pnpm db:seed:run       # 시드 데이터 삽입
```
