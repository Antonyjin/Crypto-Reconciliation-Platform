import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common'
import { TradeService } from './trade.service'
import { CreateTradeDto } from '@app/shared'

@Controller()
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}
  @Get('/trades')
  async getTrades() {
    return this.tradeService.getTrades();
  }
  @Get('/trades/:id')
  async getTradeById(@Param('id') id: string) {
    const trade = await this.tradeService.getTradeById(id);
  
    if (!trade) {
      throw new NotFoundException('Trade Not Found');
    }
  
    return trade;
  }

  @Post('/trades')
  async createTrade(@Body() data: CreateTradeDto) {
    return this.tradeService.createTrade(data);
  }

}
