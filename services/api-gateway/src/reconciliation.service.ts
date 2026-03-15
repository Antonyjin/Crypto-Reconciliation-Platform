import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Readable } from 'stream'
import csvParser from 'csv-parser'

@Injectable()
export class ReconciliationService {
  constructor(private prisma: PrismaService) {}

  parseCsv(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      Readable.from(buffer)
        .pipe(csvParser())
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', (err) => reject(err));
    });
  }

  async reconcile(csvTrades: any[]) {
    const matched: any[] = [];
    const mismatched: any[] = [];
    const missing: any[] = [];

    for (const trade of csvTrades) {
      const dbTrade = await this.prisma.trade.findFirst({
        where: { externalId: trade.externalId, exchange: trade.exchange },
      });

      if (!dbTrade) {
        missing.push(trade);
      } else if (dbTrade.amount === trade.amount && dbTrade.price === trade.price && dbTrade.side === trade.side) {
        matched.push(trade);
      } else {
        mismatched.push({ csv: trade, db: dbTrade });
      } 
    }
    
    return { matched, mismatched, missing };
  }
}
