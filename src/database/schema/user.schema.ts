import {integer, pgEnum, pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum('role', ['user', 'admin']);

export const users = pgTable( 'users',  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', {length: 255}).notNull().unique(),
    fullname: varchar('fullname', { length: 255 }).notNull(),
    password: varchar('password', {length: 245}).notNull(),
    refreshToken: text('refresh_token'),
    role: roleEnum('role').default('user'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    otpToken: varchar('otp_token', {length: 255}),
    otpExpiry: timestamp('otp_expiry'),
    otpAttempts: integer('otp_attempts').default(0),
})

// Type Export
export type User = typeof users.$inferInsert;
export type NewUser = typeof users.$inferInsert;
