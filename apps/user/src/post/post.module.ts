import { PrismaModule } from '@libs/prisma'
import { Module } from '@nestjs/common'
import { PostController } from './post.controller'
import { PostRepository } from './post.repository'
import { PostService } from './post.service'

@Module({
    imports: [PrismaModule],
    controllers: [PostController],
    providers: [PostService, PostRepository],
    exports: [PostService]
})
export class PostModule {}
