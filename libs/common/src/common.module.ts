import { Global, Module } from '@nestjs/common'
import { EmailModule } from './email/email.module'
import { EmailService } from './email/email.interface'
import { CryptoService, TokenService } from './service'
import { JwtAccessStrategy } from './strategy/jwt-access.strategy'
import { JwtRefreshStrategy } from './strategy/jwt-refresh.strategy'
import { CustomThrottlerModule } from './throttler/custom-throttler.module'
import { RedisModule } from './redis'

@Global()
@Module({
    imports: [CustomThrottlerModule, RedisModule.forRootAsync(), EmailModule],
    providers: [CryptoService, TokenService, JwtAccessStrategy, JwtRefreshStrategy],
    exports: [CryptoService, TokenService, JwtAccessStrategy, JwtRefreshStrategy, EmailService]
})
export class CommonModule {}
