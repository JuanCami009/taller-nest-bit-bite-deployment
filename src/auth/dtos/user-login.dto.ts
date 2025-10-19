import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class UserLoginDto {

    @ApiProperty({ example: 'example@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'strongPassword123', description: 'User password' })
    @IsString()
    password: string;
}