import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
        ConfigModule.forRoot({
            validate,
            isGlobal: true,
        }),
        DatabaseModule,
        AuthModule,
        UsersModule,
        MailModule
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}
