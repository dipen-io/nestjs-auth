import { IsEmail, IsString, Length, MinLength } from "class-validator";

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @IsString()
    @Length(6 ,6,  {message: 'OTP must be exactly 6 digit' })
    otp: string;

    @IsString()
    @MinLength(3)
    newPassword: string;
}
