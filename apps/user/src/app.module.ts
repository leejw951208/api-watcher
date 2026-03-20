import {
    CommonModule,
    commonEnvConfig,
    CustomClsMiddleware,
    HealthModule,
    JwtAccessGuard,
    LoggerMiddleware,
    winstonModuleAsyncOptions
} from '@libs/common'
import { PrismaModule } from '@libs/prisma'
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { WinstonModule } from 'nest-winston'
import { ClsModule } from 'nestjs-cls'
import * as path from 'path'
import { userEnvConfig } from './config/user-env.config'
import { validateUserEnv } from './config/user-env.validator'
import { AuthModule } from './auth/auth.module'
import { NotificationModule } from './notification/notification.module'
import { PostModule } from './post/post.module'
import { UserMonitoringModule } from './monitoring/monitoring.module'
import { UserModule } from './user/user.module'
import { WebhookModule } from './webhook/webhook.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                path.resolve(process.cwd(), `./envs/.env.${process.env.NODE_ENV}`), // 공통
                path.resolve(process.cwd(), `./apps/user/envs/.env.${process.env.NODE_ENV}`) // 앱 전용
            ],
            load: [commonEnvConfig, userEnvConfig],
            validate: validateUserEnv
        }),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: false }
        }),
        WinstonModule.forRootAsync(winstonModuleAsyncOptions),
        CommonModule,
        PrismaModule,
        AuthModule,
        UserModule,
        PostModule,
        NotificationModule,
        UserMonitoringModule,
        WebhookModule,
        HealthModule
    ],
    providers: [{ provide: APP_GUARD, useClass: JwtAccessGuard }]
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(LoggerMiddleware)
            .forRoutes({ path: '*splat', method: RequestMethod.ALL })
            .apply(CustomClsMiddleware)
            .forRoutes({ path: '*splat', method: RequestMethod.ALL })
    }
}
