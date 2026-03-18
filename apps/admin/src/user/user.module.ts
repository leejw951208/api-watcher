import { Module } from '@nestjs/common'
import { AdminUserController } from './user.controller'
import { AdminUserRepository } from './user.repository'
import { AdminUserService } from './user.service'

@Module({
    controllers: [AdminUserController],
    providers: [AdminUserService, AdminUserRepository]
})
export class AdminUserModule {}
