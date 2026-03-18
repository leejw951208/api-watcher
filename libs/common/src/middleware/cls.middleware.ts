import { Injectable, NestMiddleware } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { NextFunction, Request, Response } from 'express'
import { ClsService } from 'nestjs-cls'

@Injectable()
export class CustomClsMiddleware implements NestMiddleware {
    constructor(
        private readonly cls: ClsService,
        private readonly jwtService: JwtService
    ) {}

    use(req: Request, res: Response, next: NextFunction) {
        this.cls.run(() => {
            const authHeader = req.headers.authorization
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.slice(7)
                const decodedPayload = this.jwtService.decode(token)
                if (decodedPayload) {
                    this.cls.set('id', decodedPayload.id ?? 0)
                    this.cls.set('aud', decodedPayload.aud ?? null)
                }
            }

            const agent = req.headers['user-agent'] ?? 'unknown'
            this.cls.set('agent', agent)

            const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress
            this.cls.set('clientIp', clientIp)

            next()
        })
    }
}
