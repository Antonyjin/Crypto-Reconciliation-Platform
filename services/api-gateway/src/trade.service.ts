import { Injectable } from "@nestjs/common";
import { CreateTradeDto } from "@app/shared";
import { PrismaService } from "./prisma.service";

@Injectable()
export class TradeService {
  constructor(private prisma: PrismaService) {}

  getTrades() {
    return this.prisma.trade.findMany();
  }

  getTradeById(id: string) {
    return this.prisma.trade.findUnique({ where: { id } });
  }

  createTrade(data: CreateTradeDto) {
    return this.prisma.trade.create({ data });
  }
}
