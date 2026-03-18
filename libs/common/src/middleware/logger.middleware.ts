import { Inject, Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger) {}

    use(req: Request, res: Response, next: NextFunction) {
        // 요청 객체로부터 ip, http method, url, user agent를 받아온 후
        const { ip, method, originalUrl } = req
        const userAgent = req.get('user-agent')

        // 응답이 끝나는 이벤트가 발생하면 로그를 찍는다.
        res.on('finish', () => {
            const { statusCode } = res
            this.logger.log(`${method} ${originalUrl} ${statusCode} ${ip} ${userAgent}`, this.constructor.name)
        })

        next()
    }
}
