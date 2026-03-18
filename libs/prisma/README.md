# Prisma Library

Prisma ORM 설정 및 데이터베이스 관리 라이브러리입니다.

## 구조

```
src/
├── index.ts                # Public exports
├── prisma.module.ts        # Prisma 모듈
├── prisma.service.ts       # Prisma 서비스
├── configs/                # Prisma 설정
│   ├── schema.prisma       # 메인 스키마
│   ├── prisma.config.ts    # Prisma 설정
│   ├── models/             # 모델 정의
│   │   ├── enum.prisma
│   │   ├── user.prisma
│   │   ├── post.prisma
│   │   ├── notification.prisma
│   │   ├── token.prisma
│   │   ├── admin.prisma
│   │   └── system.prisma
│   ├── migrations/         # 마이그레이션 파일
│   ├── scripts/            # DB 관리 스크립트
│   │   ├── generate.ts
│   │   ├── migrate.ts
│   │   ├── migrate-create.ts
│   │   ├── db-reset.ts
│   │   ├── seed-create.ts
│   │   └── seed-run.ts
│   └── seeds/              # 시드 데이터
│       ├── 1_role.ts
│       ├── 2_permission.ts
│       └── 3_user.ts
└── generated/              # 생성된 Prisma Client
```

## 데이터 모델

### Enums

| Enum | 값 |
|------|-----|
| `UserStatus` | ACTIVE, INACTIVE, WITHDRAWN |
| `Owner` | ADMIN, USER |
| `Platform` | WEB, ANDROID, IOS |
| `TokenType` | JWT, FCM |
| `PostStatus` | DRAFT, PUBLISHED, HIDDEN |
| `NotificationType` | SYSTEM, POST, COMMENT, USER |

### Models

| Model | 설명 |
|-------|------|
| `User` | 사용자 |
| `UserRole` | 사용자-역할 관계 |
| `Role` | 역할 |
| `Permission` | 권한 |
| `RolePermission` | 역할-권한 관계 |
| `Post` | 게시글 |
| `Notification` | 알림 |
| `NotificationRead` | 알림 읽음 상태 |
| `Token` | 토큰 (JWT, FCM) |
| `TokenJwt` | JWT 토큰 상세 |
| `Admin` | 관리자 |
| `AdminRole` | 관리자-역할 관계 |

## 명령어

### Prisma Client 생성

```bash
yarn db:generate
```

### 마이그레이션

```bash
# 마이그레이션 실행
yarn db:migrate

# 새 마이그레이션 생성
yarn db:migrate:create
```

### 데이터베이스 초기화

```bash
yarn db:reset
```

### 시드 데이터

```bash
# 시드 파일 생성
yarn db:seed:create

# 시드 실행
yarn db:seed:run
```

## 사용 방법

### 모듈 등록

```typescript
import { PrismaModule } from '@libs/prisma'

@Module({
    imports: [PrismaModule],
})
export class AppModule {}
```

### 서비스 주입

```typescript
import { PrismaService } from '@libs/prisma'

@Injectable()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: number) {
        return this.prisma.user.findUnique({ where: { id } })
    }
}
```

### 타입 Import

```typescript
import { User, Post, UserStatus, PostStatus } from '@libs/prisma'
```

## 스키마 구조

### Multi-Schema 설정

```prisma
generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["multiSchema", "typedSql"]
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
    schemas  = ["public", "base"]
}
```

### 공통 필드 패턴

모든 모델은 다음 공통 필드를 포함합니다:

```prisma
model Example {
    id        Int       @id @default(autoincrement())

    // Audit fields
    createdAt DateTime  @default(now()) @map("created_at")
    createdBy Int?      @map("created_by")
    updatedAt DateTime? @map("updated_at")
    updatedBy Int?      @map("updated_by")

    // Soft delete
    isDeleted Boolean?  @default(false) @map("is_deleted")
    deletedAt DateTime? @map("deleted_at")
    deletedBy Int?      @map("deleted_by")
}
```

## TypedSQL

Prisma의 TypedSQL 기능을 사용하여 타입 안전한 Raw SQL 쿼리를 작성할 수 있습니다:

```typescript
import { PrismaClient } from '@libs/prisma'

const prisma = new PrismaClient()

// TypedSQL 쿼리 사용
const result = await prisma.$queryRawTyped(getUserStats(userId))
```

## 주의사항

1. **스키마 변경 후**: 반드시 `yarn db:generate` 실행
2. **모델 추가/수정 후**: 마이그레이션 생성 및 실행
3. **generated 폴더**: Git에서 제외 (.gitignore)
4. **환경 변수**: `DATABASE_URL` 필수 설정
