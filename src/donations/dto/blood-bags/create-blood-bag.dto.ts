import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber } from 'class-validator';

export class CreateBloodBagDto {
    @ApiProperty({
        example: 100,
        description: 'The quantity of blood in the bag (in ml)',
    })
    @IsNumber()
    quantity: number;

    @ApiProperty({
        example: '2023-10-01',
        description: 'The date when the blood was donated',
    })
    @IsDateString()
    donationDate: Date;

    @ApiProperty({
        example: '2024-10-01',
        description: 'The expiration date of the blood bag',
    })
    @IsDateString()
    expirationDate: Date;

    @ApiProperty({
        example: 1,
        description: 'The ID of the associated request',
    })
    @IsNumber()
    requestId: number;

    @ApiProperty({ example: 2, description: 'The ID of the blood type' })
    @IsNumber()
    bloodId: number;

    @ApiProperty({ example: 3, description: 'The ID of the donor' })
    @IsNumber()
    donorId: number;
}
