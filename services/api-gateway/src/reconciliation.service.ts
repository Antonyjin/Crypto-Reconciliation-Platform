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
    let summary;

    for (const trade of csvTrades) {
      const dbTrade = await this.prisma.trade.findFirst({
        where: { externalId: trade.externalId, exchange: trade.exchange },
      });

      if (!dbTrade) {
        missing.push(trade);
    } else if (Math.abs(parseFloat(dbTrade.amount) - parseFloat(trade.amount)) <= 0.0001 && Math.abs(parseFloat(dbTrade.price) - parseFloat(trade.price)) <= 0.0001 && dbTrade.side === trade.side) {
        matched.push({ csv: trade, db: dbTrade });
      } else {
        mismatched.push({ csv: trade, db: dbTrade });
      } 
    }
    const report = await this.prisma.reconciliationReport.create({
    data: {
        date: new Date(),
      total: csvTrades.length,
        matchedCount: matched.length,
        mismatchedCount: mismatched.length,
        missingCount: missing.length,
        items: {
            create: [
              ...matched.map(trade => ({ status: "matched", csvData: trade.csv, dbData: trade.db })),
              ...mismatched.map(trade => ({ status: "mismatched", csvData: trade.csv, dbData: trade.db })),
              ...missing.map(trade =>  ({ status: "missing", csvData: trade, dbData: null })),
            ]
        }
    }
    });
    
    summary = { matched: matched.length, mismatched: mismatched.length, missing: missing.length, total: csvTrades.length };
    return { matched, mismatched, missing, summary, report };
  }

  getReports() {
    return this.prisma.reconciliationReport.findMany({ include: { items: true } });
  }

  getReportsById(id: string) {
    return this.prisma.reconciliationReport.findUnique({ where: { id }, include: { items: true } });
  }
}
