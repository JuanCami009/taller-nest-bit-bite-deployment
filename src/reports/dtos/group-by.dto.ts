import { IsEnum, IsOptional } from 'class-validator';

export enum GroupBy {
  NONE = 'none',
  DAY = 'day',
  MONTH = 'month',
}

export class GroupByDto {
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy = GroupBy.NONE;
}
