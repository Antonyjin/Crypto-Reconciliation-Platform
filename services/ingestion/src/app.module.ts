import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { BinanceController } from './binance.controller'
import { BinanceService } from './binance.service'
import { CoinbaseService } from './coinbase.service'
import { CoinbaseController } from './coinbase.controller'
import { KrakenService } from './kraken.service'
import { KrakenController } from './kraken.controller'
import { ScheduledIngestionService } from './scheduled-ingestion.service'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, BinanceController, CoinbaseController, KrakenController],
  providers: [BinanceService, CoinbaseService, KrakenService, ScheduledIngestionService],
})

export class AppModule {}
