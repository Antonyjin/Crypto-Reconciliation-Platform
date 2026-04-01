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
import { GrpcTradeClientService } from './grpc-trade-client.service'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { join } from 'path'

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "GRPC_CLIENT",
        transport: Transport.GRPC,
        options: {
          package: "trade",
          protoPath: join(__dirname, "../../../packages/shared/proto/trades.proto"),
          url: "api-gateway:5050",
        },
      }
    ]),
    ScheduleModule.forRoot()
  ],
  controllers: [AppController, BinanceController, CoinbaseController, KrakenController],
  providers: [GrpcTradeClientService, BinanceService, CoinbaseService, KrakenService, ScheduledIngestionService],
})

export class AppModule {}
