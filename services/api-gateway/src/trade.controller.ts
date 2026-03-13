import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common'
import { TradeService } from './trade.service'
import { CreateTradeDto, UpdateTradeDto, FiltersDto } from '@app/shared'

@Controller()
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}
  private async FindTradeOrFail(id: string) {
    const trade = await this.tradeService.getTradeById(id);

    if (!trade) {
      throw new NotFoundException('Trade Not Found');
    }

    return trade;
  }

  @Get('/trades')
  async getTrades(@Query() filters: FiltersDto) {
    return this.tradeService.getTrades(filters);
  }
  @Get('/trades/:id')
  async getTradeById(@Param('id') id: string) {
    return this.FindTradeOrFail(id);
  }

  @Post('/trades')
  async createTrade(@Body() data: CreateTradeDto) {
    return this.tradeService.createTrade(data);
  }
  
  @Post('/trades/upsert')
  async upsertTrades(@Body() data: CreateTradeDto) {
    return this.tradeService.upsertTrade(data);
  }

  @Put('/trades/:id')
  async updateTrade(@Param('id') id: string, @Body() data: UpdateTradeDto) {
    await this.FindTradeOrFail(id);
    return this.tradeService.updateTrade(id, data);
  }
  
  @Delete('/trades/:id')
  async deleteTrade(@Param('id') id: string): Promise<any> {
    await this.FindTradeOrFail(id);
    const deleted = this.tradeService.deleteTrade(id);

    return deleted;
  }
}
