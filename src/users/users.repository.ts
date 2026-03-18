import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN } from 'src/database/database.provider';
import * as schema from '../database/schema';
import type { DB } from 'src/database/types';
import { hash } from 'node:crypto';

@Injectable()
export class UsersRepository {
    constructor(
        @Inject(DATABASE_TOKEN)
        private db: DB,
    ) {}

    async findByEmail(email: string) {
        const [user] = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email.toLowerCase()));
        return user ?? null;
    }

    async findById(id: string) {
        return this.db.query.users.findFirst({
            where: eq(schema.users.id, id),
        });
    }

    async create(data: { email: string; password: string; fullname: string }) {
        const [newUser] = await this.db
            .insert(schema.users)
            .values({
                email: data.email.toLowerCase(),
                password: data.password,
                fullname: data.fullname,
            })
            .returning({
                id: schema.users.id,
                email: schema.users.email,
                fullname: schema.users.fullname,
                createdAt: schema.users.createdAt,
            });
        return newUser ?? null;
    }

    async updateRefreshToken(userId: string, token: string | null) {
        await this.db
        .update(schema.users)
        .set({ refreshToken: token })
        .where(eq(schema.users.id, userId));
    }

    async findProfileById(userId: string) {
        return this.db.query.users.findFirst({
            where: eq(schema.users.id, userId),
            columns: { id: true, fullname: true, email: true, createdAt: true },
        });
    }

    async updatePassword(userId: string, hashedPassword: string){
        await this.db
        .update(schema.users)
        .set({ password: hashedPassword })
        .where(eq(schema.users.id, userId))
    }

    async updatePasswordAndClearToken(userId: string, hashedPassword: string){
        await this.db
        .update(schema.users)
        .set({
            password: hashedPassword,
            refreshToken: null
        })
        .where(eq(schema.users.id, userId))
    }
}
