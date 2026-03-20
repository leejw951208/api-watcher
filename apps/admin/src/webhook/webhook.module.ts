import { PrismaModule } from '@libs/prisma'
import { Module } from '@nestjs/common'
import { AdminWebhookController } from './webhook.controller'
import { AdminWebhookRepository } from './webhook.repository'
import { AdminWebhookService } from './webhook.service'

@Module({
    imports: [PrismaModule],
    controllers: [AdminWebhookController],
    providers: [AdminWebhookService, AdminWebhookRepository]
})
export class AdminWebhookModule {}
