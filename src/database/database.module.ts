import {Module, Global} from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DATABASE_TOKEN, databaseProvider } from "./database.provider";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'CONFIG_SERVICE',
            useExisting: ConfigService,
        },
        databaseProvider
    ],
    exports: [DATABASE_TOKEN]
})

export class DatabaseModule {}
