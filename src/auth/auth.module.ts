import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { EnvVars } from 'src/config/env.validation';

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService<EnvVars>) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
  controllers: [AuthController ],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
