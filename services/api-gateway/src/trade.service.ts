import { Injectable } from "@nestjs/common";
import { CreateTradeDto, UpdateTradeDto, FiltersDto } from "@app/shared";
import { PrismaService } from "./prisma.service";

@Injectable()
export class TradeService {
  constructor(private prisma: PrismaService) {}

  getTrades(filters?: FiltersDto) {
    return this.prisma.trade.findMany({ where: filters});
  }

  getTradeById(id: string) {
    return this.prisma.trade.findUnique({ where: { id } });
  }

  createTrade(data: CreateTradeDto) {
    return this.prisma.trade.create({ data });
  }
  
updateTrade(id: string, data: UpdateTradeDto) {
    return this.prisma.trade.update({ where: { id }, data });
  }

  deleteTrade(id: string) {
    return this.prisma.trade.delete({ where: { id } });
  }
}
