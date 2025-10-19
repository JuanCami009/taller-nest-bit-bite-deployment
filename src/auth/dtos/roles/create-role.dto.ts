import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateRoleDto {

    @ApiProperty({ example: 'admin', description: 'The name of the role' })
    @IsString()
    name: string;
}
