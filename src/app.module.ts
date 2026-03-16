import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { validate } from './config/env.validation';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
        ConfigModule.forRoot({
            validate,
            isGlobal: true,
        }),
        DatabaseModule,
        AuthModule
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}
