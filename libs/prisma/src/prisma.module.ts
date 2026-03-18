import { Global, Module, OnApplicationShutdown } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

@Global()
@Module({
    providers: [
        {
            provide: PrismaService,
            inject: [WINSTON_MODULE_NEST_PROVIDER],
            useFactory: (logger: Logger) => {
                return new PrismaService(logger)
            }
        }
    ],
    exports: [PrismaService]
})
export class PrismaModule {}
