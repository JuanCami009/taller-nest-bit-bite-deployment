import { IsEnum, IsOptional } from 'class-validator';
import { Type as BloodType, Rh } from '../../donations/entities/blood.entity';

export class BloodFilterDto {
    @IsOptional()
    @IsEnum(BloodType)
    type?: BloodType;

    @IsOptional()
    @IsEnum(Rh)
    rh?: Rh;
}