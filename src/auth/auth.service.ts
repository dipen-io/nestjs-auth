import { ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { DATABASE_TOKEN } from 'src/database/database.provider';
import * as schema from '../database/schema/'
import * as argon2 from 'argon2';
import type { DB } from 'src/database/types';
import { eq } from 'drizzle-orm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvVars } from 'src/config/env.validation';
import { CurrentUser } from './decorator/current-user.decorator';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
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
                const hashed = await argon2.hash(refresh_token);
                await this.usersService.saveRefreshToken(user.id, hashed);
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

    //refreshToken
    async refresh(userId: string, email: string, rawRfreshToken: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshToken) throw new ForbiddenException('Access denied');

        const tokenMatch = await argon2.verify(user.refreshToken, rawRfreshToken);
        if (!tokenMatch) throw new ForbiddenException('Access defined');
    }


    async generateToken(userId: string, email: string ){
       const paylaod = { sub: userId, email } 

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(paylaod, {
                secret: this.env.getOrThrow('JWT_SECRET'),
                expiresIn: this.env.getOrThrow('JWT_ACCESS_TOKEN_EXPIRY')
            }),

            this.jwtService.signAsync(paylaod, {
                secret: this.env.getOrThrow('JWT_REFRESH_SECRET'),
                expiresIn: this.env.getOrThrow('JWT_REFRESH_TOKEN_EXPIRY')
            })
        ])

        //hash the refresh_token
        const hashed = await argon2.hash(refresh_token);
        await this.usersService.saveRefreshToken(userId, hashed);

        return { access_token, refresh_token }
    }
}
