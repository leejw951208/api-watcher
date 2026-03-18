import { GlobalExceptionHandler, setupSwagger } from '@libs/common'
import { ClassSerializerInterceptor, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)
    const config = app.get(ConfigService)

    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER)
    app.useLogger(logger)
    app.useGlobalFilters(new GlobalExceptionHandler(logger))

    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }))

    // API 전역 설정
    app.setGlobalPrefix('api')
    app.enableVersioning({
        type: VersioningType.URI,
        prefix: 'v',
        defaultVersion: '1'
    })

    app.enableShutdownHooks()

    // 리버스 프록시(nginx 등) 뒤에서 클라이언트 실제 IP를 신뢰하도록 설정
    // X-Forwarded-For 헤더를 1단계 프록시까지만 신뢰하여 IP 스푸핑 방지
    app.getHttpAdapter().getInstance().set('trust proxy', 1)

    app.use(cookieParser())

    // 스웨거 설정
    setupSwagger(app, 'admin')

    const port = config.get<number>('admin.port') ?? 3000
    const nodeEnv = config.get<string>('admin.nodeEnv') ?? 'local'

    await app.listen(port).then(() => {
        logger.log(
            `[Admin] App is running on port ${port} in ${nodeEnv} environment,
                swagger: http://localhost:${port}/admin/api/docs
            `
        )
    })
}
bootstrap()
