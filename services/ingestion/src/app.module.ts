import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
// import { AppService } from './app.service'
import { BinanceController } from './binance.controller'
import { BinanceService } from './binance.service'

@Module({
  controllers: [AppController, BinanceController],
  providers: [BinanceService],
})

export class AppModule {}
