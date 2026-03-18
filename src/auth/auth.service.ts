import {
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

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private env: ConfigService<EnvVars>,
    private jwtService: JwtService,
  ) {}

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
}
