import { Injectable, Inject, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { lastValueFrom } from 'rxjs';

interface TradeGrpcService {
    upsertTrade(data: any): any;
}

@Injectable()
export class GrpcTradeClientService implements OnModuleInit {
    private tradeService!: TradeGrpcService;

    constructor(@Inject('GRPC_CLIENT') private client: ClientGrpc) {}

    onModuleInit() {
        this.tradeService = this.client.getService<TradeGrpcService>('TradeService');
    }

    async upsertTrade(data: any) {
        return await lastValueFrom(this.tradeService.upsertTrade(data));
    }
}
