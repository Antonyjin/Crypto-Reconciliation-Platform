import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ReconciliationService } from './reconciliation.service'

@Controller()
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('reconciliation/upload')
  @UseInterceptors(FileInterceptor('file'))
  async reconcile(@UploadedFile() file: Express.Multer.File) {
    const csvTrades = await this.reconciliationService.parseCsv(file.buffer);
    return this.reconciliationService.reconcile(csvTrades);
  }
}
