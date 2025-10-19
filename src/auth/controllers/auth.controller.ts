import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserLoginDto } from '../dtos/user-login.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Successful login' })
    @ApiBody({ type: UserLoginDto })
    @Post('login')
    async login(@Body() body: UserLoginDto) {
        return this.authService.login(body);
    }
}
