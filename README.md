## 📋 요구사항

- Node.js 22.16.0 이상
- PostgreSQL 15.0 이상

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd monorepo
```

### 2. 의존성 설치

```bash
yarn install
```

### 3. prisma 마이그레이션

```bash
yarn db:migrate
```

### 4. 애플리케이션 실행

```bash
# APP = api | admin
yarn start:local {APP}
```

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
    - `http://localhost:3000/api/v1/docs`
    - `http://localhost:3000/admin/v1/docs`
