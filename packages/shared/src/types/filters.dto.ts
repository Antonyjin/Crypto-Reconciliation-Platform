import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';

export class FiltersDto {
  @IsOptional()
  @IsIn(['binance', 'coinbase', 'kraken'])
  exchange?: 'binance' | 'coinbase' | 'kraken';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  baseAsset?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  quoteAsset?: string;

  @IsOptional()
  @IsIn(['BUY', 'SELL'])
  side?: 'BUY' | 'SELL';
}
