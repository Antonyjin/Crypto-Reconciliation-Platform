import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common'
import { TradeService } from './trade.service'
import { Trade, CreateTradeDto } from '@app/shared'

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

  @Post('/trades')
  createTrade(@Body() data: CreateTradeDto) {
    return this.tradeService.createTrade(data);
  }

}
