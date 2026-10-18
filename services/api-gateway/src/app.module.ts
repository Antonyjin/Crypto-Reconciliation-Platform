import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TradeService } from './trade.service'
import { TradeController } from './trade.controller'
import { TradeGrpcController } from './trade.grpc.controller'
import { PrismaService } from './prisma.service'
import { ReconciliationController } from './reconciliation.controller'
import { ReconciliationService } from './reconciliation.service'
import { SettlementGrpcController } from './settlement.grpc.controller'
import { SettlementService } from './settlement.service'

@Module({
  controllers: [AppController, TradeController, TradeGrpcController, ReconciliationController, SettlementGrpcController],
  providers: [AppService, TradeService, PrismaService, ReconciliationService, SettlementService],
})

export class AppModule {}
