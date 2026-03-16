import {Module, Global} from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';
import { DATABASE_TOKEN, databaseProvider } from "./database.provider";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        databaseProvider
    ],
    exports: [ DATABASE_TOKEN ]
})

export class DatabaseModule {}
