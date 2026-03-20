import { Global, Module } from '@nestjs/common'
import { EmailModule } from './email/email.module'
import { CryptoService, TokenService } from './service'
import { JwtAccessStrategy } from './strategy/jwt-access.strategy'
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy'
import { CustomThrottlerModule } from './throttler/custom-throttler.module'
import { RedisModule } from './redis'

@Global()
@Module({
    imports: [RedisModule.forRootAsync(), CustomThrottlerModule, EmailModule],
    providers: [CryptoService, TokenService, JwtAccessStrategy, JwtRefreshStrategy],
    exports: [CryptoService, TokenService, JwtAccessStrategy, JwtRefreshStrategy, EmailModule]
})
export class CommonModule {}
