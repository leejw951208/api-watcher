import { Module } from '@nestjs/common'
import { AdminPostController } from './post.controller'
import { AdminPostRepository } from './post.repository'
import { AdminPostService } from './post.service'

@Module({
    controllers: [AdminPostController],
    providers: [AdminPostService, AdminPostRepository]
})
export class AdminPostModule {}
