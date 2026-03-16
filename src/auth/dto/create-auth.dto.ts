import { IsEmail, IsEnum,  IsNotEmpty, IsOptional, IsString,Matches, MaxLength, MinLength } from "class-validator"; 
import { UserRole } from "../enum/user-role.enum";

export class CreateAuthDto {

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;
    
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    fullname: string;

    @IsString()
    @MinLength(4)
    @MaxLength(255)
    // @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: string;

}
