import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication, appName?: string): void {
    const config = app.get(ConfigService)

    const title = `${config.get<string>('APP_NAME')} API Documents`
    const version = `${config.get<string>('APP_VERSION')}`
    const description = ``

    const swaggerUri = appName ? `${appName}/api/docs` : '/api/docs'

    const documentBuilder = new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .setVersion(version)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header'
            },
            'JWT-Auth'
        )
        .build()
    const customOptions = {
        customSiteTitle: title,
        yamlDocumentUrl: `${swaggerUri}/yaml`,
        jsonDocumentUrl: `${swaggerUri}/json`,
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'none'
        }
    }

    const documentOption: SwaggerDocumentOptions = {
        ignoreGlobalPrefix: false,
        extraModels: []
    }

    const document = SwaggerModule.createDocument(app, documentBuilder, documentOption)
    SwaggerModule.setup(swaggerUri, app, document, customOptions)
}
