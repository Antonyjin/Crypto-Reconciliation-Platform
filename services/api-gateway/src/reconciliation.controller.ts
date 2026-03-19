import { Controller, Post, Get, Param, UploadedFile, UseInterceptors, NotFoundException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ReconciliationService } from './reconciliation.service'


@Controller()
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}
  private async FindReportOrFail(id: string) {
    const report = await this.reconciliationService.getReportsById(id);

    if (!report) {
      throw new NotFoundException('Report Not Found');
    }

    return report;
  }


  @Post('reconciliation/upload')
  @UseInterceptors(FileInterceptor('file'))
  async reconcile(@UploadedFile() file: Express.Multer.File) {
    const csvTrades = await this.reconciliationService.parseCsv(file.buffer);
    return this.reconciliationService.reconcile(csvTrades);
  }

  @Get('/reconciliation/reports')
  async getReports() {
    return this.reconciliationService.getReports();
  }
  @Get('/reconciliation/reports/:id')
  async getReportsById(@Param('id') id: string) {
    return this.FindReportOrFail(id);
  }
}
