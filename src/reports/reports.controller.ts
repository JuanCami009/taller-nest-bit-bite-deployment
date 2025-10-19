import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../common/guards/permission.guard';
import { Permissions } from '../common/decorators/permission.decorator';
import { TimeRangeDto } from './dtos/time-range.dto';
import { BloodFilterDto } from './dtos/blood-filter.dto';
import { PaginationDto } from './dtos/pagination.dto';
import { GroupByDto } from './dtos/group-by.dto';
import { ApiBearerAuth, ApiQuery, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @ApiOperation({ summary: 'Get inventory report by blood type' })
  @ApiResponse({ status: 200, description: 'Inventory report retrieved successfully' })
  @ApiQuery({ name: 'range', type: TimeRangeDto })
  @ApiQuery({ name: 'filter', type: BloodFilterDto })
  @Get('inventory')
  @Permissions('report_read')
  async inventory(@Query() range: TimeRangeDto, @Query() filter: BloodFilterDto) {
    return this.reportsService.inventoryByBlood(range, filter);
  }

  @ApiOperation({ summary: 'Get requests fulfillment report' })
  @ApiResponse({ status: 200, description: 'Requests fulfillment report retrieved successfully' })
  @ApiQuery({ name: 'range', type: TimeRangeDto })
  @ApiQuery({ name: 'page', type: PaginationDto })
  @Get('requests/fulfillment')
  @Permissions('report_read')
  async fulfillment(@Query() range: TimeRangeDto, @Query() page: PaginationDto) {
    return this.reportsService.requestsFulfillment(range, page);
  }

  @ApiOperation({ summary: 'Get overdue requests report' })
  @ApiResponse({ status: 200, description: 'Overdue requests report retrieved successfully' })
  @Get('requests/overdue')
  @Permissions('report_read')
  async overdue() {
    return this.reportsService.overdueRequests();
  }

  @ApiOperation({ summary: 'Get donors activity report' })
  @ApiResponse({ status: 200, description: 'Donors activity report retrieved successfully' })
  @ApiQuery({ name: 'range', type: TimeRangeDto })
  @Get('donors/activity')
  @Permissions('report_read')
  async donorsActivity(@Query() range: TimeRangeDto) {
    return this.reportsService.donorsActivity(range);
  }

  @ApiOperation({ summary: 'Get health entities summary report' })
  @ApiResponse({ status: 200, description: 'Health entities summary report retrieved successfully' })
  @ApiQuery({ name: 'range', type: TimeRangeDto })
  @Get('health-entities/summary')
  @Permissions('report_read')
  async healthEntities(@Query() range: TimeRangeDto) {
    return this.reportsService.healthEntitiesSummary(range);
  }

  @ApiOperation({ summary: 'Get donations grouped by blood type report' })
  @ApiResponse({ status: 200, description: 'Donations by blood type report retrieved successfully' })
  @ApiQuery({ name: 'range', type: TimeRangeDto })
  @ApiQuery({ name: 'gb', type: GroupByDto })
  @Get('donations/by-blood')
  @Permissions('report_read')
  async donationsByBlood(@Query() range: TimeRangeDto, @Query() gb: GroupByDto) {
    return this.reportsService.donationsByBlood(range, gb);
  }
}
