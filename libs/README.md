# Shared Libraries

NestJS 모노레포의 공유 라이브러리 디렉토리입니다.

## 구조

```
libs/
├── common/         # 공통 유틸리티, 가드, 데코레이터, 미들웨어
└── prisma/         # Prisma ORM 설정 및 서비스
```

## 라이브러리 목록

| Library | 설명 | Path Alias |
|---------|------|------------|
| [common](./common/) | 공통 모듈 (가드, 데코레이터, 예외, 미들웨어 등) | `@libs/common` |
| [prisma](./prisma/) | Prisma ORM 설정 및 데이터베이스 서비스 | `@libs/prisma` |

## 사용 방법

### Import

```typescript
// Common 라이브러리
import { JwtAccessGuard, BaseException, AUTH_ERROR } from '@libs/common'

// Prisma 라이브러리
import { PrismaService, User, Post } from '@libs/prisma'
```

### Path Alias 설정

`tsconfig.json`에 정의된 경로 별칭:

```json
{
  "compilerOptions": {
    "paths": {
      "@libs/common": ["libs/common/src"],
      "@libs/common/*": ["libs/common/src/*"],
      "@libs/prisma": ["libs/prisma/src"],
      "@libs/prisma/*": ["libs/prisma/src/*"]
    }
  }
}
```

## 라이브러리 추가 가이드

새로운 공유 라이브러리를 추가하려면:

```bash
# NestJS CLI로 라이브러리 생성
nest generate library {library-name}
```

생성 후 `tsconfig.json`에 path alias를 추가합니다.
