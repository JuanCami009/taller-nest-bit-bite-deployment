import { PartialType, OmitType } from "@nestjs/mapped-types";
import { CreateBloodBagDto } from "./create-blood-bag.dto";

export class UpdateBloodBagDto extends PartialType(
    OmitType(CreateBloodBagDto, ['donationDate', 'expirationDate', 'bloodId', 'requestId', 'donorId'] as const)
){}