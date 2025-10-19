import { IsEmail, IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateHealthEntityDto {

    @ApiProperty({ example: '123456789', description: 'The NIT of the health entity' })
    @IsString()
    nit: string;

    @ApiProperty({ example: 'Health Entity Name', description: 'The name of the health entity' })
    @IsString()
    name: string;

    @ApiProperty({ example: '123 Main St', description: 'The address of the health entity' })
    @IsString()
    address: string;

    @ApiProperty({ example: 'Springfield', description: 'The city of the health entity' })
    @IsString()
    city: string;

    @ApiProperty({ example: '555-1234', description: 'The phone number of the health entity' })
    @IsString()
    phone: string;

    @ApiProperty({ example: 'contact@healthentity.com', description: 'The email of the health entity' })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Hospital', description: 'The type of institution (e.g., Hospital, Clinic)' })
    @IsString()
    institutionType: string;

    @ApiProperty({ example: 1, description: 'The user ID of the health entity' })
    @IsNumber()
    userId: number;

}