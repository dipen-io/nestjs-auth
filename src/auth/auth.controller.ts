import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import { string } from 'node_modules/zod/v4/mini/coerce.cjs';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signup(@Body() createAuthDto: CreateAuthDto) {
        const user = await this.authService.register(createAuthDto);
        return {
            message:"User Created Successfully",
            data: user
        }
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const user = await this.authService.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid Credentials');
        }
        //NOTE: we will return an jwt here 
        return { message: 'Login Successfully', user }

    }

    // this is from token
    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMe(@CurrentUser() user: { userId: string; email: string }) {
        // user.userId comes from JwtStrategy validate()
        return {
            id: user.userId,
            email: user.email,
        };
    }

    // this is from db
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getMeFromDb(
        @CurrentUser() user: { userId: string }
    ) {
        return this.authService.getMeFromDb(user);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.authService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
        return this.authService.update(+id, updateAuthDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.authService.remove(+id);
    }
}
