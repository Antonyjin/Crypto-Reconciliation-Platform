import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5050',
      package: 'trade',
      protoPath: join(__dirname, '../../../packages/shared/proto/trades.proto'),
    },
  })
  await app.listen(process.env.PORT ?? 3000);
  await app.startAllMicroservices()
}
bootstrap();
