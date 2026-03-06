import {IsString, IsIn, IsNotEmpty, IsOptional} from 'class-validator'

export class CreateTradeDto {
  @IsIn(['binance', 'coinbase', 'kraken'])
  exchange!: 'binance' | 'coinbase' | 'kraken';
  
  @IsNotEmpty()
  @IsString()
  baseAsset!: string;

  @IsNotEmpty()
  @IsString()
  quoteAsset!: string;

  @IsIn(['BUY', 'SELL'])
  side!: 'BUY' | 'SELL';
  
  @IsNotEmpty()
  @IsString()
  amount!: string;

  @IsNotEmpty()
  @IsString()
  price!: string;

  @IsOptional()
  @IsString()
  fee?: string;
  
  @IsOptional()
  @IsString()
  feeAsset?: string;
}
