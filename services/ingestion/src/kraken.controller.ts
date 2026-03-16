import { Controller, Get, Post, Query} from '@nestjs/common'
import { KrakenService } from './kraken.service'

@Controller()
export class KrakenController {
  constructor(private readonly krakenService: KrakenService) {}
  
  @Get('/kraken/trades')
  async getTrades(@Query('symbol') symbol: string) {
    return this.krakenService.getRecentTrades(symbol);
  }

  @Post('kraken/ingest')
  async ingestTrades(@Query('symbol') symbol: string) {
    return this.krakenService.ingestTrades(symbol);
  }
}
