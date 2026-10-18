import { Injectable } from "@nestjs/common";
import { CreateTradeDto, UpdateTradeDto, FiltersDto } from "@app/shared";
import { PrismaService } from "./prisma.service";

@Injectable()
export class SettlementService {
  constructor(private prisma: PrismaService) {}

  getTrades(filters?: FiltersDto) {
    return this.prisma.settlement.findMany({ where: filters});
  }

  getSettlementById(id: string) {
    return this.prisma.settlement.findUnique({ where: { id } });
  }

  createSettlement(data: CreateTradeDto) {
    return this.prisma.settlement.create({ data });
  }
  
  updateSettlement(id: string, data: UpdateTradeDto) {
    return this.prisma.settlement.update({ where: { id }, data });
  }

  upsertSettlement(data: CreateTradeDto) {
    return this.prisma.settlement.upsert({
      where: {
        externalId_exchange: {
          externalId: data.externalId,
          exchange: data.exchange,
        },
      },
      create: data,
      update: {},
    });
  }

  deletesettlement(id: string) {
    return this.prisma.settlement.delete({ where: { id } });
  }
}
