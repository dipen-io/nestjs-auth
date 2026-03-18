import { Injectable } from '@nestjs/common';
import { UsersRespository } from './users.repository';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRespository) {}

    async findByEmail(email: string) {
        return this.usersRepository.findByEmail(email);
    }

    async findById(id: string) {
        return this.usersRepository.findById(id);
    }

    async saveRefreshToken(userId: string, hashedToken: string) {
        return this.usersRepository.updateRefreshToken(userId, hashedToken)
    }
}
