import { Inject, Injectable, Logger } from '@nestjs/common'
import { type ConfigType } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import { commonEnvConfig } from '../config'
import { EmailService } from './email.interface'

@Injectable()
export class NodemailerService extends EmailService {
    private readonly logger = new Logger(NodemailerService.name)
    private readonly transporter: nodemailer.Transporter

    constructor(@Inject(commonEnvConfig.KEY) private readonly config: ConfigType<typeof commonEnvConfig>) {
        super()
        this.transporter = nodemailer.createTransport({
            host: config.emailHost,
            port: config.emailPort,
            secure: config.emailPort === 465,
            auth: {
                user: config.emailUser,
                pass: config.emailPassword
            }
        })
    }

    async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"API Watcher" <${this.config.emailFrom}>`,
                to,
                subject: '[API Watcher] 비밀번호 재설정 안내',
                html: this.buildPasswordResetTemplate(resetLink)
            })
        } catch (error) {
            // 이메일 발송 실패 시 서비스 중단 없이 로그만 기록
            this.logger.error(`비밀번호 재설정 이메일 발송 실패: ${to}`, error)
        }
    }

    async sendPasswordChangedEmail(to: string): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"API Watcher" <${this.config.emailFrom}>`,
                to,
                subject: '[API Watcher] 비밀번호가 변경되었습니다',
                html: this.buildPasswordChangedTemplate()
            })
        } catch (error) {
            this.logger.error(`비밀번호 변경 알림 이메일 발송 실패: ${to}`, error)
        }
    }

    private buildPasswordResetTemplate(resetLink: string): string {
        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>비밀번호 재설정</h2>
                <p>아래 버튼을 클릭하여 비밀번호를 재설정하세요.</p>
                <p>링크는 <strong>30분</strong> 동안 유효하며, 한 번만 사용할 수 있습니다.</p>
                <a href="${resetLink}"
                   style="display: inline-block; padding: 12px 24px; background-color: #4F46E5;
                          color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
                    비밀번호 재설정
                </a>
                <p style="color: #6B7280; font-size: 14px;">
                    본인이 요청하지 않은 경우 이 이메일을 무시하세요.
                </p>
            </div>
        `
    }

    private buildPasswordChangedTemplate(): string {
        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>비밀번호 변경 완료</h2>
                <p>비밀번호가 성공적으로 변경되었습니다.</p>
                <p style="color: #6B7280; font-size: 14px;">
                    본인이 요청하지 않은 경우 즉시 고객센터에 문의하세요.
                </p>
            </div>
        `
    }
}
