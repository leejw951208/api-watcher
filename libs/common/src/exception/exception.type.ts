const GeneralType = 'GENERAL'
const NotFoundType = 'NOT_FOUND'
export type SeedErrorType = typeof GeneralType
export type BadRequestType = typeof GeneralType
export type NotFoundType = typeof GeneralType
export type ServerErrorType = typeof GeneralType | 'CONFIG_VALIDATION_ERROR'
export type AuthErrorType =
    | 'MISSING_ACCESS_TOKEN'
    | 'MISSING_REFRESH_TOKEN'
    | 'INVALID_ACCESS_TOKEN'
    | 'INVALID_REFRESH_TOKEN'
    | 'EXPIRED_ACCESS_TOKEN'
    | 'EXPIRED_REFRESH_TOKEN'
    | 'PASSWORD_NOT_MATCHED'
    | 'RESOURCE_ACCESS_DENIED'
    | 'INVALID_RESET_TOKEN'
    | 'RATE_LIMIT_EXCEEDED'
export type UserErrorType = typeof NotFoundType | 'ALREADY_EXISTS_EMAIL' | 'VERIFICATION_FAILED' | 'ALREADY_DELETED'
export type PostErrorType = typeof NotFoundType | 'FORBIDDEN'
export type NotificationErrorType = typeof NotFoundType
export type ThrottlerErrorType = 'RATE_LIMIT_EXCEEDED'
export type MonitoringErrorType =
    | typeof NotFoundType
    | 'DUPLICATE_URL'
    | 'INVALID_URL'
    | 'CHECK_FAILED'
    | 'ENDPOINT_LIMIT_EXCEEDED'
    | 'FORBIDDEN'
export type WebhookErrorType = typeof NotFoundType | 'INVALID_URL' | 'CHANNEL_LIMIT_EXCEEDED' | 'DUPLICATE_URL' | 'DISPATCH_FAILED' | 'FORBIDDEN'
