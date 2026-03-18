# Applications

NestJS 모노레포의 애플리케이션 디렉토리입니다.

## 구조

```
apps/
├── user/           # 사용자용 API 서버
└── admin/          # 관리자용 API 서버
```

## 애플리케이션 목록

| App | 설명 | 포트 (로컬) | 포트 (Docker) | API 문서 |
|-----|------|------------|---------------|----------|
| [user](./user/) | 사용자용 REST API | 3000 | 3000 | `/api/docs` |
| [admin](./admin/) | 관리자용 REST API | 3000 | 3001 | `/admin/api/docs` |

> **Note**: 로컬 환경에서는 두 앱이 동일한 포트(3000)를 사용하므로 동시 실행 불가

## 실행 방법

### 개발 환경

```bash
# User 앱 실행
yarn start:local:user

# Admin 앱 실행
yarn start:local:admin
```

### 빌드

```bash
# User 앱 빌드
yarn build:user

# Admin 앱 빌드
yarn build:admin
```

### Docker

```bash
# 전체 서비스 실행
docker compose up -d --build

# 특정 앱만 실행
docker compose up -d user --build
docker compose up -d admin --build
```

## 공통 설정

모든 애플리케이션은 다음 공통 설정을 공유합니다:

- **Logger**: Winston (daily rotate file)
- **Exception Handler**: Global exception filter
- **Validation**: ValidationPipe (transform, whitelist, forbidNonWhitelisted)
- **Serialization**: ClassSerializerInterceptor
- **API Versioning**: URI 기반 (기본: v1)
- **Swagger**: OpenAPI 3.0 자동 생성

## 환경 변수

환경 변수는 `envs/` 디렉토리에 위치합니다:

- `.env.local` - 로컬 개발 환경
- `.env.prod` - 프로덕션 환경

앱별 환경 변수는 `apps/{app-name}/envs/`에 위치합니다.
