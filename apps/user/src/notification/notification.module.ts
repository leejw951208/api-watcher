import { PrismaModule } from '@libs/prisma'
import { Module } from '@nestjs/common'
import { NotificationController } from './notification.controller'
import { NotificationRepository } from './notification.repository'
import { NotificationService } from './notification.service'

@Module({
    imports: [PrismaModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationRepository],
    exports: [NotificationService]
})
export class NotificationModule {}
