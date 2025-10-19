import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRequestDto } from "./create-request.dto";

export class UpdateRequestDto extends PartialType(
    OmitType(CreateRequestDto, ['healthEntityId', 'bloodId'] as const),
){}