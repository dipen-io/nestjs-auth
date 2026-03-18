import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvVars } from "src/config/env.validation";
import * as nodemailer from "nodemailer"

@Injectable()
export class MailService {
    private transporter : nodemailer.Transporter;

    constructor(private env: ConfigService<EnvVars>) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.env.getOrThrow('MAIL_USER'),
                pass: this.env.getOrThrow('MAIL_PASSWORD')
            },
        });
    }

    async sendOtpEmail(email: string, otp: string) {
        try {

            await this.transporter.sendMail({
                from: `"Auth System <${this.env.getOrThrow('MAIL_USER')}>`,
                to: email,
                subject: 'Password Reset OTP',
                html: `
                <div style="font-family:sans-serif;max-width:400px;margin:auto">
                <h2>Password Reset</h2>
                <p>Your OTP code is:</p>
                <div style="
                font-size:36px;
                font-weight:bold;
                letter-spacing:8px;
                background:#f4f4f4;
                padding:16px 24px;
                border-radius:8px;
                text-align:center;
                color:#4F46E5;
                ">${otp}</div>
                <p>This OTP expires in <strong>5 minutes</strong>.</p>
                <p>You have <strong>5 attempts</strong> before it gets locked.</p>
                <p style="color:#999;font-size:12px">
                If you did not request this, ignore this email.
                </p>
                </div>
                `,
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to send OTP email');
        }
    }
    async sendEmailVerificationOtp(email: string, otp: string) {
        try {
            await this.transporter.sendMail({
                from: `"Auth System" <${this.env.getOrThrow('MAIL_USER')}>`,
                to: email,
                subject: 'Verify Your Email',
                html: `
                <div style="font-family:sans-serif;max-width:400px;margin:auto">
                <h2>Verify Your Email</h2>
                <p>Use the OTP below to verify your email address:</p>
                <div style="
                font-size:36px;
                font-weight:bold;
                letter-spacing:8px;
                background:#f4f4f4;
                padding:16px 24px;
                border-radius:8px;
                text-align:center;
                color:#4F46E5;
                ">${otp}</div>
                <p>This OTP expires in <strong>5 minutes</strong>.</p>
                <p>You have <strong>5 attempts</strong> before it gets locked.</p>
                <p style="color:#999;font-size:12px">
                If you did not create an account, ignore this email.
                </p>
                </div>
                `,
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to send verification email');
        }
    }
}
