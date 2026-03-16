import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
// import { AppService } from './app.service'
import { BinanceController } from './binance.controller'
import { BinanceService } from './binance.service'
import { CoinbaseService } from './coinbase.service'
import { CoinbaseController } from './coinbase.controller'
import { KrakenService } from './kraken.service'
import { KrakenController } from './kraken.controller'

@Module({
  controllers: [AppController, BinanceController, CoinbaseController, KrakenController],
  providers: [BinanceService, CoinbaseService, KrakenService],
})

export class AppModule {}
