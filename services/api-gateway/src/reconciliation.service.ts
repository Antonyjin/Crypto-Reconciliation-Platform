import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Readable } from 'stream'
import csvParser from 'csv-parser'

const TOLERANCE = 0.0001;
const TIMESTAMP_WINDOW_MS = 5000; // 5 seconds

interface ConfidenceBreakdown {
  amount: number;
  price: number;
  side: number;
  timestamp: number;
}

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

  calculateConfidence(csvTrade: any, dbTrade: any): { score: number; breakdown: ConfidenceBreakdown } {
    const breakdown: ConfidenceBreakdown = {
      amount: 0,
      price: 0,
      side: 0,
      timestamp: 0,
    };

    // Amount comparison (0-30 points)
    const amountDiff = Math.abs(parseFloat(dbTrade.amount) - parseFloat(csvTrade.amount));
    if (amountDiff <= TOLERANCE) {
      breakdown.amount = 30;
    } else if (amountDiff <= 0.01) {
      breakdown.amount = 20;
    } else if (amountDiff <= 0.1) {
      breakdown.amount = 10;
    }

    // Price comparison (0-30 points)
    const priceDiff = Math.abs(parseFloat(dbTrade.price) - parseFloat(csvTrade.price));
    if (priceDiff <= TOLERANCE) {
      breakdown.price = 30;
    } else if (priceDiff <= 0.01) {
      breakdown.price = 20;
    } else if (priceDiff <= 1) {
      breakdown.price = 10;
    }

    // Side comparison (0-20 points)
    if (dbTrade.side === csvTrade.side) {
      breakdown.side = 20;
    }

    // Timestamp comparison (0-20 points)
    if (csvTrade.timestamp && dbTrade.timestamp) {
      const csvTime = new Date(csvTrade.timestamp).getTime();
      const dbTime = new Date(dbTrade.timestamp).getTime();
      const timeDiff = Math.abs(csvTime - dbTime);

      if (timeDiff <= 1000) {
        breakdown.timestamp = 20;
      } else if (timeDiff <= TIMESTAMP_WINDOW_MS) {
        breakdown.timestamp = 15;
      } else if (timeDiff <= 30000) {
        breakdown.timestamp = 5;
      }
    } else {
      // No timestamp to compare — give neutral score
      breakdown.timestamp = 10;
    }

    const score = breakdown.amount + breakdown.price + breakdown.side + breakdown.timestamp;
    return { score, breakdown };
  }

  async findByTimestamp(csvTrade: any): Promise<any | null> {
    if (!csvTrade.timestamp) return null;

    const csvTime = new Date(csvTrade.timestamp);
    const windowStart = new Date(csvTime.getTime() - TIMESTAMP_WINDOW_MS);
    const windowEnd = new Date(csvTime.getTime() + TIMESTAMP_WINDOW_MS);

    const candidates = await this.prisma.trade.findMany({
      where: {
        exchange: csvTrade.exchange,
        baseAsset: csvTrade.baseAsset,
        quoteAsset: csvTrade.quoteAsset,
        timestamp: { gte: windowStart, lte: windowEnd },
      },
    });

    if (candidates.length === 0) return null;

    // Pick the candidate with the highest confidence
    let bestMatch: any = null;
    let bestScore = 0;

    for (const candidate of candidates) {
      const { score } = this.calculateConfidence(csvTrade, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    // Only accept fuzzy matches above 50% confidence
    return bestScore >= 50 ? bestMatch : null;
  }

  async reconcile(csvTrades: any[]) {
    const matched: any[] = [];
    const mismatched: any[] = [];
    const missing: any[] = [];

    for (const trade of csvTrades) {
      // Step 1: Try exact match by externalId + exchange
      const dbTrade = await this.prisma.trade.findFirst({
        where: { externalId: trade.externalId, exchange: trade.exchange },
      });

      if (dbTrade) {
        const { score, breakdown } = this.calculateConfidence(trade, dbTrade);

        if (score >= 80) {
          matched.push({ csv: trade, db: dbTrade, confidence: score, breakdown, matchType: 'exact' });
        } else {
          mismatched.push({ csv: trade, db: dbTrade, confidence: score, breakdown, matchType: 'exact' });
        }
        continue;
      }

      // Step 2: Try fuzzy match by timestamp proximity
      const fuzzyMatch = await this.findByTimestamp(trade);

      if (fuzzyMatch) {
        const { score, breakdown } = this.calculateConfidence(trade, fuzzyMatch);

        if (score >= 80) {
          matched.push({ csv: trade, db: fuzzyMatch, confidence: score, breakdown, matchType: 'fuzzy' });
        } else {
          mismatched.push({ csv: trade, db: fuzzyMatch, confidence: score, breakdown, matchType: 'fuzzy' });
        }
        continue;
      }

      // Step 3: No match found
      missing.push(trade);
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
            ...matched.map(t => ({
              status: 'matched',
              matchType: t.matchType,
              confidence: t.confidence,
              csvData: t.csv,
              dbData: t.db,
            })),
            ...mismatched.map(t => ({
              status: 'mismatched',
              matchType: t.matchType,
              confidence: t.confidence,
              csvData: t.csv,
              dbData: t.db,
            })),
            ...missing.map(t => ({
              status: 'missing',
              matchType: null,
              confidence: null,
              csvData: t,
              dbData: null,
            })),
          ],
        },
      },
    });

    const summary = {
      matched: matched.length,
      mismatched: mismatched.length,
      missing: missing.length,
      total: csvTrades.length,
    };

    return { matched, mismatched, missing, summary, report };
  }

  getReports() {
    return this.prisma.reconciliationReport.findMany({ include: { items: true } });
  }

  getReportsById(id: string) {
    return this.prisma.reconciliationReport.findUnique({ where: { id }, include: { items: true } });
  }
}
