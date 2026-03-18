# Common Library

애플리케이션 전반에서 사용되는 공통 모듈입니다.

## 구조

```
src/
├── index.ts                # Public exports
├── common.module.ts        # 공통 모듈
├── configs/                # 환경 설정
│   ├── common-env.config.ts
│   └── index.ts
├── decorators/             # 커스텀 데코레이터
│   ├── api-auth-guard.decorator.ts
│   ├── api-exception-response.decorator.ts
│   ├── api-ok-base-response.decorator.ts
│   ├── api-ok-cursor-pagination-response.decorator.ts
│   ├── api-ok-offset-pagination-response.decorator.ts
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── index.ts
├── dtos/                   # 공통 DTO
│   ├── cursor-request.dto.ts
│   ├── cursor-response.dto.ts
│   ├── offset-request.dto.ts
│   ├── offset-response.dto.ts
│   ├── response.dto.ts
│   └── index.ts
├── exceptions/             # 예외 처리
│   ├── base.exception.ts
│   ├── exception.code.ts
│   ├── exception.filter.ts
│   ├── exception.type.ts
│   └── index.ts
├── guards/                 # 인증/인가 가드
│   ├── jwt-access.guard.ts
│   ├── jwt-refresh.guard.ts
│   ├── permission.guard.ts
│   └── index.ts
├── middlewares/            # 미들웨어
│   ├── logger.middleware.ts
│   ├── cls.middleware.ts
│   └── index.ts
├── redis/                  # Redis 모듈
│   ├── redis.module.ts
│   └── index.ts
├── services/               # 공통 서비스
│   ├── crypto.service.ts
│   ├── token.service.ts
│   └── index.ts
├── strategies/             # Passport 전략
│   ├── jwt-access.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── index.ts
└── throttler/              # Rate Limiting
    ├── throttler.guard.ts
    └── index.ts
```

## 주요 기능

### Decorators

| Decorator | 설명 |
|-----------|------|
| `@Public()` | JWT 인증 건너뛰기 |
| `@CurrentUser()` | 현재 사용자 정보 주입 |
| `@ApiAuthGuard()` | Swagger + JWT Guard 통합 |
| `@ApiExceptionResponse()` | Swagger 에러 응답 문서화 |
| `@ApiOkBaseResponse()` | Swagger 성공 응답 문서화 |
| `@ApiOkOffsetPaginationResponse()` | Swagger Offset 페이지네이션 응답 |
| `@ApiOkCursorPaginationResponse()` | Swagger Cursor 페이지네이션 응답 |

### Guards

| Guard | 설명 |
|-------|------|
| `JwtAccessGuard` | Access Token 검증 (Global Guard) |
| `JwtRefreshGuard` | Refresh Token 검증 |
| `PermissionGuard` | Role 기반 권한 검증 |
| `CustomThrottlerGuard` | Rate Limiting |

### DTOs

| DTO | 설명 |
|-----|------|
| `OffsetRequestDto` | Offset 페이지네이션 요청 |
| `OffsetResponseDto<T>` | Offset 페이지네이션 응답 |
| `CursorRequestDto` | Cursor 페이지네이션 요청 |
| `CursorResponseDto<T>` | Cursor 페이지네이션 응답 |
| `ResponseDto<T>` | 표준 API 응답 |
| `CreateResponseDto` | 생성 응답 (id 반환) |

### Exceptions

| Error Code | 설명 |
|------------|------|
| `AUTH_ERROR` | 인증 관련 에러 |
| `USER_ERROR` | 사용자 관련 에러 |
| `POST_ERROR` | 게시글 관련 에러 |
| `NOTIFICATION_ERROR` | 알림 관련 에러 |
| `BAD_REQUEST` | 잘못된 요청 |
| `NOT_FOUND` | 리소스 없음 |
| `SERVER_ERROR` | 서버 에러 |

### Services

| Service | 설명 |
|---------|------|
| `TokenService` | JWT 토큰 생성/검증, Redis 저장 관리 |
| `CryptoService` | 비밀번호 해시/비교 (bcrypt) |

## 사용 예시

### Guard 적용

```typescript
import { ApiAuthGuard, Public } from '@libs/common'

@ApiAuthGuard()  // JWT 인증 + Swagger 문서화
@Controller('users')
export class UserController {

    @Public()  // 인증 건너뛰기
    @Get('public')
    getPublicData() {}

    @Get('me')  // 인증 필요
    getMe(@CurrentUser() user: JwtPayload) {}
}
```

### 예외 처리

```typescript
import { BaseException, USER_ERROR } from '@libs/common'

if (!user) {
    throw new BaseException(USER_ERROR.NOT_FOUND, this.constructor.name)
}
```

### 페이지네이션

```typescript
import { OffsetRequestDto, OffsetResponseDto } from '@libs/common'

async getUsers(dto: OffsetRequestDto): Promise<OffsetResponseDto<UserDto>> {
    const [data, total] = await this.repository.findAndCount(dto)
    return new OffsetResponseDto(data, total, dto)
}
```

## Import

```typescript
// 전체 import
import {
    JwtAccessGuard,
    Public,
    CurrentUser,
    BaseException,
    AUTH_ERROR,
    OffsetResponseDto
} from '@libs/common'
```
