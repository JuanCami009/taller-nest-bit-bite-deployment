import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNumber } from "class-validator";

export class CreateRequestDto{

    @ApiProperty({ example: 10, description: 'The quantity of blood needed (in units)' })
    @IsNumber()
    quantityNeeded: number;

    @ApiProperty({ example: '2023-12-01', description: 'The due date for the blood request' })
    @IsDateString()
    dueDate: Date;

    @ApiProperty({ example: 2, description: 'The ID of the blood type needed' })
    @IsNumber()
    bloodId: number;

    @ApiProperty({ example: 1, description: 'The ID of the health entity making the request' })
    @IsNumber()
    healthEntityId: number;
    
}