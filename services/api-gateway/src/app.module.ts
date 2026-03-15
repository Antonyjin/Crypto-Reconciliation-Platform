import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TradeService } from './trade.service'
import { TradeController } from './trade.controller'
import { PrismaService } from './prisma.service'
import { ReconciliationController } from './reconciliation.controller'
import { ReconciliationService } from './reconciliation.service'

@Module({
  controllers: [AppController, TradeController, ReconciliationController],
  providers: [AppService, TradeService, PrismaService, ReconciliationService],
})

export class AppModule {}
