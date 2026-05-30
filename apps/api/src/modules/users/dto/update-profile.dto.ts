import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
  IsUrl,
  Matches,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Ivan',
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Имя не может превышать 50 символов' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Ivanov',
    description: 'User last name',
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Фамилия должна содержать минимум 2 символа' })
  @MaxLength(50, { message: 'Фамилия не может превышать 50 символов' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+79001234567',
    description: 'Phone number in international format',
  })
  @IsOptional()
  @IsPhoneNumber('RU', { message: 'Укажите корректный российский номер телефона' })
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar image URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Укажите корректный URL аватара' })
  avatarUrl?: string;
  @ApiPropertyOptional({
    example: 'ivan_ivanov',
    description: 'Public profile username',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/, {
    message: 'Username may contain lowercase letters, numbers, underscores, and hyphens, and must start and end with a letter or number',
  })
  username?: string;

  @ApiPropertyOptional({
    example: 'Author channel description',
    description: 'Public author bio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/banner.jpg',
    description: 'Public author banner image URL',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Invalid banner URL' })
  bannerUrl?: string;
}
