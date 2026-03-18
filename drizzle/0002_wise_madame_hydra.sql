ALTER TABLE "users" ADD COLUMN "otp_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "otp_attempts" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_otp" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_otp_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_otp_attempts" integer DEFAULT 0;