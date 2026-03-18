import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { DATABASE_TOKEN } from 'src/database/database.provider';
import * as schema from '../database/schema/'
import * as argon2 from 'argon2';
import type { DB } from 'src/database/types';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from 'src/config/env.validation';
import { CurrentUser } from './decorator/current-user.decorator';

@Injectable()
export class AuthService {
    constructor(
        private env: ConfigService<EnvVars>,
        private jwtService: JwtService,
        @Inject(DATABASE_TOKEN)
        private db: DB
    ){}

    //regiser user
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

    //login user
    async validateUser(email: string, pass: string): Promise<any>{
        // find user by email
        const [user] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()));

        if (user) {
            // compare password
            const isPassMatch = await argon2.verify(user.password, pass);
            if (isPassMatch) {
                const { access_token, refresh_token }= await this.generateToken(user.id, user.email);
                await this.updateRefreshToken(user.id, refresh_token)
                const {password, refreshToken, ...result} = user;
                return {
                    result, 
                    access_token: access_token,
                };
            }
        }
        return null
    }

    // me /profile
    async getMeFromDb(@CurrentUser() user: { userId: string }) {
        const dbUser = await this.db.query.users.findFirst({
            where: eq(schema.users.id, user.userId),
            columns: { id: true, fullname: true, email: true, createdAt: true }, // select only what you need
        });

        if (!dbUser) {
            throw new NotFoundException('User not found');
        }

        return{
            message: "Fetched Users Details from db",
            data:dbUser
        }
    }
    //logout user
    async logout(userId: string) {
        await this.db
        .update(schema.users)
        .set({refreshToken: null})
        .where(eq(schema.users.id, userId))
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

    async generateToken(userId: string | number, email: string ){
       const paylaod = { sub: userId, email } 

        const access_token = await this.jwtService.signAsync(paylaod, {
            expiresIn: this.env.getOrThrow('JWT_ACCESS_TOKEN_EXPIRY')
        });

        const refresh_token = await this.jwtService.signAsync(paylaod, {
            expiresIn: this.env.getOrThrow('JWT_REFRESH_TOKEN_EXPIRY')
        });

        return { access_token, refresh_token }
    }

    async updateRefreshToken(userId: string , refreshToken: string){
        const hashed =  await argon2.hash(refreshToken);

         await this.db
        .update(schema.users)
        .set({refreshToken: hashed})
        .where(eq(schema.users.id, userId))
    }
}
