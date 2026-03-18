import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, UnauthorizedException, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorator/current-user.decorator';
import type { Response } from 'express';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

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
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true}) res: Response
    ) {
        const user = await this.authService.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid Credentials');
        }

        // sending token expiry as header metadata
        res.setHeader('X-Token-Expires-In', '3600');

        //NOTE: we will return an jwt here 
        return { message: 'Login Successfully', user }

    }

    @UseGuards(JwtRefreshGuard)
    @Post('refresh')
    refresh(
        @CurrentUser() user: {userId: string; email: string; refreshToken: string}
    ){
        return this.authService.refresh(user.userId, user.email, user.refreshToken);
    }

    // this is from db
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getMeFromDb(
        @CurrentUser() user: { userId: string }
    ) {
        return this.authService.getProfile(user.userId);
    }

}
