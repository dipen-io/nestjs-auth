import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async findByEmail(email: string) {
        return this.usersRepository.findByEmail(email);
    }

    async findById(id: string) {
        return this.usersRepository.findById(id);
    }

    async create(data: { email: string; password: string; fullname: string }) {
        return this.usersRepository.create(data);
    }

    async saveRefreshToken(userId: string, token: string | null) {
        return this.usersRepository.updateRefreshToken(userId, token);
    }

    async findProfile(userId: string) {
        return this.usersRepository.findProfileById(userId);
    }

    async updatePassword (userId: string, hashedPassword: string){
        return this.usersRepository.updatePasswordAndClearToken(userId, hashedPassword);
    }
}
