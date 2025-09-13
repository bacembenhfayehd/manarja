import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsEnum, 
  IsOptional, 
  IsPhoneNumber,
  Matches,
  MaxLength 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'invalid email' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password should be at least 8 caracters' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password should have uppercase , lowercas and number'
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'firstname should have at least 2 caracters' })
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'lastname should have at least 2 caracters' })
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @IsOptional()
  @IsPhoneNumber('TN', { message: 'TN phone number invalid' })
  phone?: string;

  @IsEnum(UserRole, { message: 'invalid role :/' })
  role: UserRole;

  @IsOptional()
  @IsString()
  profileImage?: string;
}