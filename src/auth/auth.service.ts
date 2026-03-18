import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from 'src/config/env.validation';
import { UsersService } from 'src/users/users.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from 'src/mail/mail.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { hash } from 'node:crypto';

@Injectable()
export class AuthService {
    constructor(
        private mailService: MailService,
        private usersService: UsersService,
        private env: ConfigService<EnvVars>,
        private jwtService: JwtService,
    ) {}

    // helper — reuse for both register and resend
    private async sendEmailOtp(userId: string, email: string) {
      const otp     = Math.floor(100000 + Math.random() * 900000).toString();
      const hashed  = await argon2.hash(otp);
      const expiry  = new Date(Date.now() + 5 * 60 * 1000);

      await this.usersService.saveEmailOtp(userId, hashed, expiry);
      await this.mailService.sendEmailVerificationOtp(email, otp);
    }

    // register new user
    async register(createAuthDto: CreateAuthDto) {
        const hashedPassword = await argon2.hash(createAuthDto.password);

        try {
            const newUser = await this.usersService.create({
                email: createAuthDto.email,
                password: hashedPassword,
                fullname: createAuthDto.fullname,
            });

            if (!newUser) throw new InternalServerErrorException('User creation failed');

            //send email
            await this.sendEmailOtp(newUser.id, newUser.email);

            return newUser;

        } catch (error) {
            if (error.code === '23505') throw new ConflictException('Email already exists!');
            throw error; // re-throw — don't swallow NestJS exceptions
        }
    }

    //login user
    async validateUser(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isPassMatch = await argon2.verify(user.password, pass);
        if (!isPassMatch) throw new UnauthorizedException('Invalid credentials');

        // generateTokens handles hashing + saving refresh token internally
        const { access_token, refresh_token } = await this.generateTokens(user.id, user.email);

        const { password, refreshToken, ...result } = user;
        return { user: result, access_token, refresh_token };
    }

    //fetch profile
    async getProfile(userId: string) {
        const user = await this.usersService.findProfile(userId);
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    //refresh_token 
    async refresh(userId: string, email: string, rawRefreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) throw new ForbiddenException('Access denied');

        const tokenMatch = await argon2.verify(user.refreshToken, rawRefreshToken);
        if (!tokenMatch) throw new ForbiddenException('Access denied');

        // generate + rotate both tokens
        return this.generateTokens(userId, email);
    }

    async logout(userId: string) {
        await this.usersService.saveRefreshToken(userId, null);
        return { message: 'Logged out successfully' };
    }

    // private — only used inside AuthService
    private async generateTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.env.getOrThrow('JWT_SECRET'),
                expiresIn: this.env.getOrThrow('JWT_ACCESS_TOKEN_EXPIRY'),
            }),
            this.jwtService.signAsync(payload, {
                secret: this.env.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.env.getOrThrow('JWT_REFRESH_TOKEN_EXPIRY'),
            }),
        ]);

        // hash and persist refresh token
        const hashed = await argon2.hash(refresh_token);
        await this.usersService.saveRefreshToken(userId, hashed);

        return { access_token, refresh_token };
    }

    async changedPassword(userId: string, dto: ChangePasswordDto){

        // fetch user from db
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        //verify old password
        const isPassMatch = await argon2.verify(user.password, dto.oldPassword)
        if (!isPassMatch) throw new UnauthorizedException('Old password is incorrect');

        // make user new password is different
        const isPassSame = await argon2.verify(user.password, dto.newPassword)
        if (isPassSame) throw new ConflictException('New password must be different from old password');

        // hash pasword 
        const hashed = await argon2.hash(dto.newPassword);
        await this.usersService.updatePassword(userId, hashed);

        return { message: 'Password changed successfully. Please login again.' };
    }

    async forgotpassword(email: string) {
        const user = await this.usersService.findByEmail(email);

        if (!user) return { message: 'If that email exists, an OTP has been sent.' };

        // generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        //hash the otp
        const hashed = await argon2.hash(otp);

        // 5 min expriry
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        await this.usersService.saveOtp(user.id, hashed, expiry);

        //send raw otp in email
        await this.mailService.sendOtpEmail(user.email, otp);

        return { message: 'If that email exists, an OTP has been sent.' };

    }

    async resetPasswordWithOtp(dto: VerifyOtpDto){
        const user = await this.usersService.findByEmail(dto.email);
        if (!user || !user.otpToken || !user.otpExpiry) {
            throw new BadRequestException('Invalid or expired OTP!');
        }

        if (user.otpAttempts! >= 5) {
            await this.usersService.clearOtp(user.id);
            throw new BadRequestException('Too many attempts. Please request a new OTP.');
        }

        if (new Date() > user.otpExpiry) {
            await this.usersService.clearOtp(user.id);
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        const isMatch = await argon2.verify(user.otpToken, dto.otp);
        if (!isMatch) {
            await this.usersService.incrementOtpAttempts(user.id);
            const remaining = 5 - (user.otpAttempts! + 1);
            throw new BadRequestException(
                `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            );
        }

        const hashed = await argon2.hash(dto.newPassword);
        await this.usersService.resetPassword(user.id, hashed);

        return { message: 'Password reset successfully. Please login again.' };
    }

    async verifyEmail(userId: string, otp: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (user.isEmailVerified) {
            return {message: 'Email is already verified. '};
        }

        if (!user.emailOtp || !user.emailOtpExpiry) {
            throw new BadRequestException('No OTP found. Please request a new one');
        }

        if (user.emailOtpAttempts! >= 5) {
            await this.usersService.clearEmailOtp(user.id);
            throw new BadRequestException('Too many attempts. Please request a new OTP.');
        }

        if (new Date() > user.emailOtpExpiry) {
            await this.usersService.clearEmailOtp(user.id);
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        const isMatch = await argon2.verify(user.emailOtp, otp);
        if (!isMatch) {
            await this.usersService.incrementEmailOtpAttempts(user.id);
            const remaining = 5 - (user.emailOtpAttempts! + 1);
            throw new BadRequestException(
                `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            )
        }
        await this.usersService.markEmailVerified(user.id);
        return { message: 'Email verified successfully.' };

    }

    async resetEmailOtp(userId: string, email: string) {
        const user = await this.usersService.findById(userId);
        if (!user) throw new NotFoundException('User not found');

        if (user.isEmailVerified) {
            return {message: 'Email is already verified'};
        }

        await this.sendEmailOtp(userId, email);
        return { message: 'A new OTP has been sent to your email.' };
    }
}
