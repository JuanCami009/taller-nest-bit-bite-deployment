import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDonorDto } from './create-donor.dto';

export class UpdateDonorDto extends PartialType(
    OmitType(CreateDonorDto, ['birthDate', 'document', 'bloodId'] as const),
) {}
