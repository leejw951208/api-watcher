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
import { APP_GUARD, RouterModule } from '@nestjs/core'
import { WinstonModule } from 'nest-winston'
import { ClsModule } from 'nestjs-cls'
import * as path from 'path'
import adminEnvConfig from './configs/admin-env.config'
import { validateAdminEnv } from './configs/admin-env.validator'
import { AdminAuthModule } from './auth/auth.module'
import { NotificationModule } from './notification/notification.module'
import { AdminPostModule } from './post/post.module'
import { AdminMonitoringModule } from './monitoring/monitoring.module'
import { AdminUserModule } from './user/user.module'
import { AdminWebhookModule } from './webhook/webhook.module'

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                path.resolve(process.cwd(), `./envs/.env.${process.env.NODE_ENV}`), // 공통
                path.resolve(process.cwd(), `./apps/admin/envs/.env.${process.env.NODE_ENV}`) // 앱 전용
            ],
            load: [adminEnvConfig, commonEnvConfig],
            validate: validateAdminEnv
        }),
        ClsModule.forRoot({
            global: true,
            middleware: { mount: false }
        }),
        RouterModule.register([
            {
                path: 'admin',
                module: AppModule
            }
        ]),
        WinstonModule.forRootAsync(winstonModuleAsyncOptions),
        CommonModule,
        PrismaModule,
        AdminAuthModule,
        AdminUserModule,
        AdminPostModule,
        NotificationModule,
        AdminMonitoringModule,
        AdminWebhookModule,
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
