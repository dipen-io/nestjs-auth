import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRespository } from './users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRespository],
    exports: [UsersService]
})
export class UsersModule {}
