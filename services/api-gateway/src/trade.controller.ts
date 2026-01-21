import { Controller, Get, Param, NotFoundException } from '@nestjs/common'
import { TradeService } from './trade.service'
import { Trade } from '@app/shared'

@Controller()
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}
  @Get('/trades')
  getTrades(): Trade[] {
    return this.tradeService.getTrades();
  }
  @Get('/trades/:id')
  getTradeById(@Param('id') id: string): Trade {
    const trade = this.tradeService.getTradeById(id);
  
    if (!trade) {
      throw new NotFoundException('Trade Not Found');
    }
  
    return trade;
  }
}
