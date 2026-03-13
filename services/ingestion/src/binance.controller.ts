import { Controller, Get, Query} from '@nestjs/common'
import { BinanceService } from './binance.service'

@Controller()
export class BinanceController {
  constructor(private readonly binanceService: BinanceService) {}
  
  @Get('/binance/trades')
  async getTrades(@Query('symbol') symbol: string) {
    return this.binanceService.getRecentTrades(symbol);
  } 
}

