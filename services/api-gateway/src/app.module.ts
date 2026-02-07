import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TradeService } from './trade.service'
import { TradeController } from './trade.controller'
import { PrismaService } from './prisma.service'

@Module({
  controllers: [AppController, TradeController],
  providers: [AppService, TradeService, PrismaService],
})

export class AppModule {}
