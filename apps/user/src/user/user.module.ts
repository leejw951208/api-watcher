import { CommonModule } from '@libs/common'
import { Module } from '@nestjs/common'
import { NotificationModule } from '../notification/notification.module'
import { PostModule } from '../post/post.module'
import { UserMeController } from './user-me.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
    imports: [CommonModule, PostModule, NotificationModule],
    controllers: [UserMeController],
    providers: [UserRepository, UserService],
    exports: [UserRepository]
})
export class UserModule {}
