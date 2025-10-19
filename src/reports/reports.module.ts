import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { DonationsModule } from '../donations/donations.module';

@Module({
  imports: [DonationsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
