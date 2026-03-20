import {
    AuthErrorType,
    BadRequestType,
    MonitoringErrorType,
    NotFoundType,
    NotificationErrorType,
    PostErrorType,
    SeedErrorType,
    ServerErrorType,
    ThrottlerErrorType,
    UserErrorType,
    WebhookErrorType
} from './exception.type'

export interface ExceptionCodeData {
    code: string
    status: number
    message: string
}

// 공통 에러 코드
export const BAD_REQUEST: {
    [key in BadRequestType]: ExceptionCodeData
} = {
    GENERAL: {
        status: 400,
        code: 'BAD_REQUEST_001',
        message: '잘못된 요청 입니다.'
    }
}

export const NOT_FOUND: {
    [key in NotFoundType]: ExceptionCodeData
} = {
    GENERAL: {
        status: 404,
        code: 'NOT_FOUND_001',
        message: '리소스를 찾을 수 없습니다.'
    }
}

export const SERVER_ERROR: {
    [key in ServerErrorType]: ExceptionCodeData
} = {
    GENERAL: {
        status: 500,
        code: 'SERVER_ERROR_001',
        message: '요청을 처리하던 중 오류가 발생 하였습니다'
    },
    CONFIG_VALIDATION_ERROR: {
        status: 500,
        code: 'SERVER_ERROR_002',
        message: '환경 변수 검증 중 오류가 발생 하였습니다.'
    }
}

export const SEED_ERROR: {
    [key in SeedErrorType]: ExceptionCodeData
} = {
    GENERAL: {
        status: 500,
        code: 'SEED_ERROR_001',
        message: '시드 실행 중 오류가 발생 하였습니다.'
    }
}

export const AUTH_ERROR: {
    [key in AuthErrorType]: ExceptionCodeData
} = {
    MISSING_ACCESS_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_001',
        message: '인증 토큰을 찾을 수 없습니다.'
    },
    MISSING_REFRESH_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_002',
        message: '리프레시 토큰을 찾을 수 없습니다.'
    },
    INVALID_ACCESS_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_003',
        message: '유효하지 않은 인증 토큰입니다.'
    },
    EXPIRED_ACCESS_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_004',
        message: '인증 토큰이 만료되었습니다.'
    },
    EXPIRED_REFRESH_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_005',
        message: '리프레시 토큰이 만료되었습니다.'
    },
    INVALID_REFRESH_TOKEN: {
        status: 401,
        code: 'AUTH_ERROR_006',
        message: '유효하지 않은 리프레시 토큰입니다.'
    },
    PASSWORD_NOT_MATCHED: {
        status: 401,
        code: 'AUTH_ERROR_007',
        message: '비밀번호가 일치하지 않습니다.'
    },
    RESOURCE_ACCESS_DENIED: {
        status: 403,
        code: 'AUTH_ERROR_008',
        message: '리소스 접근 권한이 없습니다.'
    },
    INVALID_RESET_TOKEN: {
        status: 400,
        code: 'AUTH_ERROR_009',
        message: '유효하지 않은 비밀번호 재설정 토큰입니다.'
    },
    RATE_LIMIT_EXCEEDED: {
        status: 429,
        code: 'AUTH_ERROR_015',
        message: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'
    }
}

export const USER_ERROR: {
    [key in UserErrorType]: ExceptionCodeData
} = {
    NOT_FOUND: {
        status: 404,
        code: 'USER_ERROR_001',
        message: '회원 정보를 찾을 수 없습니다.'
    },
    ALREADY_EXISTS_EMAIL: {
        status: 400,
        code: 'USER_ERROR_003',
        message: '이미 존재하는 이메일입니다.'
    },
    VERIFICATION_FAILED: {
        status: 400,
        code: 'USER_ERROR_004',
        message: '회원 인증에 실패했습니다. 이름과 이메일을 확인해주세요.'
    },
    ALREADY_DELETED: {
        status: 400,
        code: 'USER_ERROR_005',
        message: '이미 탈퇴한 회원입니다.'
    }
}

export const POST_ERROR: {
    [key in PostErrorType]: ExceptionCodeData
} = {
    NOT_FOUND: {
        status: 404,
        code: 'POST_ERROR_001',
        message: '게시글을 찾을 수 없습니다.'
    },
    FORBIDDEN: {
        status: 403,
        code: 'POST_ERROR_002',
        message: '게시글에 대한 권한이 없습니다.'
    }
}

export const NOTIFICATION_ERROR: {
    [key in NotificationErrorType]: ExceptionCodeData
} = {
    NOT_FOUND: {
        status: 404,
        code: 'NOTIFICATION_ERROR_001',
        message: '알림을 찾을 수 없습니다.'
    }
}

export const THROTTLER_ERROR: {
    [key in ThrottlerErrorType]: ExceptionCodeData
} = {
    RATE_LIMIT_EXCEEDED: {
        status: 429,
        code: 'THROTTLER_ERROR_001',
        message: '요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.'
    }
}

export const MONITORING_ERROR: {
    [key in MonitoringErrorType]: ExceptionCodeData
} = {
    NOT_FOUND: {
        status: 404,
        code: 'MONITORING_ERROR_001',
        message: '모니터링 엔드포인트를 찾을 수 없습니다.'
    },
    DUPLICATE_URL: {
        status: 400,
        code: 'MONITORING_ERROR_002',
        message: '이미 등록된 URL입니다.'
    },
    INVALID_URL: {
        status: 400,
        code: 'MONITORING_ERROR_003',
        message: '유효하지 않은 URL 형식입니다.'
    },
    CHECK_FAILED: {
        status: 500,
        code: 'MONITORING_ERROR_004',
        message: '헬스체크 실행 중 오류가 발생했습니다.'
    },
    ENDPOINT_LIMIT_EXCEEDED: {
        status: 400,
        code: 'MONITORING_ERROR_005',
        message: '엔드포인트 등록 제한을 초과했습니다.'
    },
    FORBIDDEN: {
        status: 403,
        code: 'MONITORING_ERROR_006',
        message: '해당 엔드포인트에 접근 권한이 없습니다.'
    }
}

export const WEBHOOK_ERROR: {
    [key in WebhookErrorType]: ExceptionCodeData
} = {
    NOT_FOUND: {
        status: 404,
        code: 'WEBHOOK_ERROR_001',
        message: 'Webhook 채널을 찾을 수 없습니다.'
    },
    INVALID_URL: {
        status: 400,
        code: 'WEBHOOK_ERROR_002',
        message: '올바르지 않은 Webhook URL입니다.'
    },
    CHANNEL_LIMIT_EXCEEDED: {
        status: 400,
        code: 'WEBHOOK_ERROR_003',
        message: 'Webhook 채널 수 제한(5개)을 초과했습니다.'
    },
    DUPLICATE_URL: {
        status: 400,
        code: 'WEBHOOK_ERROR_004',
        message: '이미 등록된 Webhook URL입니다.'
    },
    DISPATCH_FAILED: {
        status: 500,
        code: 'WEBHOOK_ERROR_005',
        message: 'Webhook 발송에 실패했습니다.'
    },
    FORBIDDEN: {
        status: 403,
        code: 'WEBHOOK_ERROR_006',
        message: '해당 Webhook 채널에 접근할 수 없습니다.'
    }
}
