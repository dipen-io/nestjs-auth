import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { validate } from './config/env.validation';

@Module({
  imports: [
        ConfigModule.forRoot({
            validate,
            isGlobal: true,
        }),
        DatabaseModule
    ],
  controllers: [],
  providers: [],
})
export class AppModule {}
