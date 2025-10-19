import {  IsDateString, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateDonorDto{

    @ApiProperty({ example: '123456789', description: 'The document number of the donor' })
    @IsString()
    document: string;

    @ApiProperty({ example: 'John', description: 'The name of the donor' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'Doe', description: 'The lastname of the donor' })
    @IsString()
    lastname: string;

    @ApiProperty({ example: '1990-01-01', description: 'The birth date of the donor' })
    @IsDateString()
    birthDate: Date;

    @ApiProperty({ example: 1, description: 'The user ID of the donor' })
    @IsNumber()
    userId: number;

    @ApiProperty({ example: 1, description: 'The blood type ID of the donor' })
    @IsNumber()
    bloodId: number;
    
}