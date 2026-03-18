/**
 * 이메일 발송 추상 클래스
 * NestJS 의존성 주입 시 인터페이스는 런타임에 소거되므로 추상 클래스를 사용합니다.
 * 추후 AWS SES 전환 시 SesEmailService extends EmailService 로 구현체만 교체하면 됩니다.
 */
export abstract class EmailService {
    /**
     * 비밀번호 재설정 이메일 발송
     * @param to 수신자 이메일
     * @param resetLink 재설정 링크 (토큰 포함)
     */
    abstract sendPasswordResetEmail(to: string, resetLink: string): Promise<void>

    /**
     * 비밀번호 변경 완료 알림 이메일 발송
     * @param to 수신자 이메일
     */
    abstract sendPasswordChangedEmail(to: string): Promise<void>
}
