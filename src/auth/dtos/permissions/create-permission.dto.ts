import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreatePermissionDto {

    @ApiProperty({ example: 'user_create', description: 'The name of the permission' })
    @IsString()
    name: string;
}
