import z from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'prod' , 'test' ]).default('prod'),
    PORT: z.coerce.number().positive().default(8001),
    DATABASE_URL: z.string(),
    CORS_ORIGIN: z.string(),
    JWT_SECRET:z.string(),
    JWT_REFRESH_TOKEN_EXPIRY: z.string(),
    JWT_ACCESS_TOKEN_EXPIRY: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    MAIL_PASSWORD: z.string(),
    MAIL_USER: z.string(),
})

export type EnvVars = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>) {
    const parsed = envSchema.safeParse(config);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
        throw new Error('Invalid environment variables');
    }
    return parsed.data;

}

