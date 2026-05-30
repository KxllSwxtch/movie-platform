import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@movie-platform/shared';

import { extractReferralCode } from '../../users/utils/referral.util';

const PUBLIC_REGISTRATION_ROLES = [
  UserRole.CLIENT,
  UserRole.PARTNER,
  UserRole.AUTHOR,
] as const;

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @ApiProperty({
    minLength: 8,
    maxLength: 72,
    description: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @IsString()
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @MaxLength(72, { message: 'Пароль не может превышать 72 символа' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Пароль должен содержать минимум одну заглавную букву, одну строчную и одну цифру',
  })
  password!: string;

  @ApiProperty({
    example: 'Ivan',
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя не может превышать 50 символов' })
  firstName!: string;

  @ApiProperty({
    example: 'Ivanov',
    description: 'User last name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2, { message: 'Фамилия должна содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Фамилия не может превышать 50 символов' })
  lastName!: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth in ISO format (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Укажите корректную дату в формате ГГГГ-ММ-ДД' })
  dateOfBirth!: string;

  @ApiPropertyOptional({
    description: 'Referral code from another user (optional)',
    example: 'ABC12345',
  })
  @IsOptional()
  @Transform(({ value }) => extractReferralCode(value))
  @IsString()
  @Matches(/^[A-Z0-9]{6,12}$/, {
    message: 'Введите реферальный код партнера из ссылки, например ABC12345. Email партнера не подходит.',
  })
  referralCode?: string;

  @ApiPropertyOptional({
    enum: PUBLIC_REGISTRATION_ROLES,
    default: UserRole.CLIENT,
    description: 'Requested account role. Public registration allows CLIENT, PARTNER, or AUTHOR only.',
  })
  @IsOptional()
  @IsIn(PUBLIC_REGISTRATION_ROLES, {
    message: 'Role must be CLIENT, PARTNER, or AUTHOR',
  })
  role?: UserRole.CLIENT | UserRole.PARTNER | UserRole.AUTHOR;

  @ApiPropertyOptional({
    enum: PUBLIC_REGISTRATION_ROLES,
    default: UserRole.CLIENT,
    description: 'Alias for role. Public registration allows CLIENT, PARTNER, or AUTHOR only.',
  })
  @IsOptional()
  @IsIn(PUBLIC_REGISTRATION_ROLES, {
    message: 'Requested role must be CLIENT, PARTNER, or AUTHOR',
  })
  requestedRole?: UserRole.CLIENT | UserRole.PARTNER | UserRole.AUTHOR;

  @ApiPropertyOptional({
    example: 'testauthor',
    description: 'Public username. Required for AUTHOR and PARTNER registrations.',
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be 3 to 30 characters long' })
  @MaxLength(30, { message: 'Username must be 3 to 30 characters long' })
  username?: string;

  @ApiPropertyOptional({
    description: 'Cloudflare Turnstile verification token',
  })
  @IsOptional()
  @IsString()
  turnstileToken?: string;

  @ApiProperty({
    description: 'User must accept terms and conditions',
    example: true,
  })
  @IsBoolean({ message: 'Необходимо принять условия использования' })
  acceptTerms!: boolean;
}
