import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvVars } from "src/config/env.validation";
import { DATABASE_TOKEN } from "src/database/database.provider";
import type { DB } from "src/database/types";
import * as schema from "../database/schema/"
import { eq } from "drizzle-orm";

@Injectable()
export class UsersRespository {
    constructor(
        private env: ConfigService<EnvVars>,
        @Inject(DATABASE_TOKEN)
        private db: DB
    ){}

    async findByEmail(email: string){
        const result = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .limit(1);
        return result[0] ?? null
    }

    async findById(id: string){
        const result = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);
        return result[0] ?? null
    }

    async updateRefreshToken(userId: string, hashedToken: string | null) {
        await this.db
        .update(schema.users)
        .set({ refreshToken: hashedToken })
        .where(eq(schema.users.id, userId));
    }
}
