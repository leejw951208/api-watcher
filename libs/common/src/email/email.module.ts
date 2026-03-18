import { Module } from '@nestjs/common'
import { EmailService } from './email.interface'
import { NodemailerService } from './nodemailer.service'

/**
 * 이메일 발송 모듈
 * 현재: Nodemailer
 * 향후 AWS SES 전환 시 NodemailerService → SesEmailService로 교체만 하면 됩니다.
 */
@Module({
    providers: [
        {
            provide: EmailService,
            useClass: NodemailerService
        }
    ],
    exports: [EmailService]
})
export class EmailModule {}
