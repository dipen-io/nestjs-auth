import { IsEmail,  IsNotEmpty, IsString,Matches, MaxLength, MinLength } from "class-validator"; 

export class LoginDto {

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(255)
    email: string;
    

    @IsString()
    @MinLength(4)
    @MaxLength(255)
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
    password: string;

}
