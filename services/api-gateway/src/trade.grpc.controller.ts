import { Controller } from '@nestjs/common'
import { GrpcMethod } from '@nestjs/microservices'
import { TradeService } from './trade.service'

@Controller()
export class TradeGrpcController {
  constructor(private readonly tradeService: TradeService) {}

  @GrpcMethod('TradeService', 'UpsertTrade')
  async upsertTrade(data: any) {
    const trade = await this.tradeService.upsertTrade(data);
    return {
      ...trade,
      timestamp: trade.timestamp.toISOString(),
      createdAt: trade.createdAt.toISOString(),
    };
  }
}
