import { pgTable, uuid, varchar, timestamp} from "drizzle-orm/pg-core";

export const users = pgTable( 'users',  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', {length: 255}).notNull().unique(),
    password: varchar('password', {length: 245}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    // lets add antoher filed fullname after there is already users exist 
    // if i have to done this notNull then i need to insert here default for old data
    // otherwirse i have to do this manually with without notNull
    fullname: varchar('fullname', { length: 255 }).default('Unknown').notNull()
})

// Type Export
export type User = typeof users.$inferInsert;
export type NewUser = typeof users.$inferInsert;
