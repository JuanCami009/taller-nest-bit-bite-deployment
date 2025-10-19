import { IsDateString, IsOptional } from 'class-validator';

export class TimeRangeDto {
    @IsOptional()
    @IsDateString()
    from?: string;

    @IsOptional()
    @IsDateString()
    to?: string;
}