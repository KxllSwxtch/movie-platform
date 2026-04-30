import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddSeasonDto {
  @ApiPropertyOptional({ example: 'Season 1', description: 'Season/chapter title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 1, description: 'Season/chapter number. Defaults to next available number.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  seasonNumber?: number;
}
