import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
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
  controllers: [AppController],
  providers: [],
})

export class AppModule {}
