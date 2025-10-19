import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class CreateUserDto {

    @ApiProperty({ example: 'example@example.com', description: 'The email of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'strongPassword123', description: 'The password of the user' })
    @IsString()
    password: string;

    @ApiProperty({ example: 'user', description: 'The role of the user' })
    @IsString()
    roleName: string;
}
