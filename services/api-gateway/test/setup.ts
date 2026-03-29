import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://antonyjin:password@localhost:5433/crypto_recon_test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
  return app;
}

export async function cleanDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.reconciliationItem.deleteMany();
  await prisma.reconciliationReport.deleteMany();
  await prisma.trade.deleteMany();
}
