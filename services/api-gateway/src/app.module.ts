import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TradeService } from './trade.service'
import { TradeController } from './trade.controller'

@Module({
  controllers: [AppController, TradeController],
  providers: [AppService, TradeService],
})

export class AppModule {}
