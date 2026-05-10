import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ContentStatus } from '@prisma/client';

import { CreateContentDto } from './create-content.dto';

export class UpdateContentDto extends PartialType(CreateContentDto) {
  @ApiPropertyOptional({
    example: 'my-updated-content',
    description: 'Unique URL slug. Letters, numbers and hyphens only.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(220)
  @Matches(/^[a-z0-9\u0400-\u04FF]+(?:-[a-z0-9\u0400-\u04FF]+)*$/i, {
    message: 'Slug may contain letters, numbers and hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    enum: ContentStatus,
    example: ContentStatus.PUBLISHED,
    description: 'Content publication status',
  })
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
