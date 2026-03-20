import { PrismaModule } from '@libs/prisma'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { CryptoService } from '../service/crypto.service'
import { WebhookDispatchService } from './webhook-dispatch.service'

@Module({
    imports: [HttpModule, PrismaModule],
    providers: [WebhookDispatchService, CryptoService],
    exports: [WebhookDispatchService]
})
export class WebhookCommonModule {}
