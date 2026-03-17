import { ConflictException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { DATABASE_TOKEN } from 'src/database/database.provider';
import * as schema from '../database/schema/'
import * as argon2 from 'argon2';
import type { DB } from 'src/database/types';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        @Inject(DATABASE_TOKEN)
        private db: DB
    ){}
    async register(createAuthDto: CreateAuthDto) {
        // Hash the Password 
        const hashedPassword = await argon2.hash(createAuthDto.password);

        try {
            // Insert User into db  
            const [newUser] = await this.db.insert(schema.users).values({
                email: createAuthDto.email.toLowerCase(),
                password: hashedPassword,
                fullname: createAuthDto.fullname
            })
                .returning(
                    {
                        id: schema.users.id,
                        email: schema.users.email,
                        fullname: schema.users.fullname,
                        createdAt: schema.users.createdAt,

                    }
                )
            if (!newUser) {
                throw new InternalServerErrorException('User creation failed');
            }

            return newUser;
        } catch (error) {
            if (error.code === '23505') {
                throw new ConflictException('Email already exist!');
            }
            throw new InternalServerErrorException('Registration Failed');
        }
    }

    async validateUser(email: string, pass: string): Promise<any>{
        // find user by email
        const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()));

        if (user) {
            // compare password
            const isPassMatch = await argon2.verify(user.password, pass);
            const payload = { sub: user.id, email: user.email }
            if (isPassMatch) {
                const {password, ...result} = user;
                return {
                    result, 
                    access_token: this.jwtService.sign(payload)
                };
            }
        }
        return null
    }

    findAll() {
        return `This action returns all auth`;
    }

    findOne(id: number) {
        return `This action returns a #${id} auth`;
    }

    update(id: number, updateAuthDto: UpdateAuthDto) {
        return `This action updates a #${id} auth`;
    }

    remove(id: number) {
        return `This action removes a #${id} auth`;
    }
}
