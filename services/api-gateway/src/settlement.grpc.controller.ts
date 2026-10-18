import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { SettlementService } from './settlement.service'

@Controller()
export class SettlementGrpcController {
  constructor(private readonly settlementService: SettlementService) {}

  @GrpcMethod('TradeService', 'UpsertTrade')
  async upsertTrade(data: any) {
    const trade = await this.settlementService.upsertSettlement(data);
    return {
      ...trade,
      timestamp: trade.timestamp.toISOString(),
      createdAt: trade.createdAt.toISOString(),
    };
  }
}
