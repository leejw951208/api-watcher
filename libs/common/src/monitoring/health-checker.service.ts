import { ApiEndpoint } from '@libs/prisma'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

export interface HealthCheckResult {
    endpointId: number
    statusCode: number | null
    responseTime: number | null
    isSuccess: boolean
    errorMessage: string | null
}

@Injectable()
export class HealthCheckerService {
    private readonly logger = new Logger(HealthCheckerService.name)

    constructor(private readonly httpService: HttpService) {}

    async check(endpoint: ApiEndpoint): Promise<HealthCheckResult> {
        const startTime = Date.now()

        try {
            const response = await firstValueFrom(
                this.httpService.request({
                    method: endpoint.method.toLowerCase(),
                    url: endpoint.url,
                    headers: (endpoint.headers as Record<string, string>) ?? {},
                    data: endpoint.body ?? undefined,
                    timeout: endpoint.timeout,
                    validateStatus: () => true
                })
            )

            const responseTime = Date.now() - startTime
            const isSuccess = response.status === endpoint.expectedStatus

            return {
                endpointId: endpoint.id,
                statusCode: response.status,
                responseTime,
                isSuccess,
                errorMessage: isSuccess ? null : `예상 상태코드: ${endpoint.expectedStatus}, 실제: ${response.status}`
            }
        } catch (error) {
            const responseTime = Date.now() - startTime
            const message = error instanceof Error ? error.message : '알 수 없는 오류'
            this.logger.warn(`헬스체크 실패 [${endpoint.name}]: ${message}`)

            return {
                endpointId: endpoint.id,
                statusCode: null,
                responseTime,
                isSuccess: false,
                errorMessage: message
            }
        }
    }
}
