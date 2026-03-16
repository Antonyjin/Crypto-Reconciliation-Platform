import { Controller, Get, Post, Query} from '@nestjs/common'
import { CoinbaseService } from './coinbase.service'

@Controller()
export class CoinbaseController {
  constructor(private readonly coinbaseService: CoinbaseService) {}
  
  @Get('/coinbase/trades')
  async getTrades(@Query('symbol') symbol: string) {
    return this.coinbaseService.getRecentTrades(symbol);
  }

  @Post('coinbase/ingest')
  async ingestTrades(@Query('symbol') symbol: string) {
    return this.coinbaseService.ingestTrades(symbol);
  }
}
