import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: 'MY_SECRET_KEY',
            signOptions: {expiresIn: '1h'}
        }),
    ],
  controllers: [AuthController, JwtStrategy],
  providers: [AuthService],
})
export class AuthModule {}
