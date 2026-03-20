import { WebhookCommonModule } from '@libs/common'
import { PrismaModule } from '@libs/prisma'
import { Module } from '@nestjs/common'
import { WebhookController } from './webhook.controller'
import { WebhookRepository } from './webhook.repository'
import { WebhookService } from './webhook.service'

@Module({
    imports: [WebhookCommonModule, PrismaModule],
    controllers: [WebhookController],
    providers: [WebhookService, WebhookRepository]
})
export class WebhookModule {}
