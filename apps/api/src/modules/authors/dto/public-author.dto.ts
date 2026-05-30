import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Min, Max } from "class-validator";

import { ContentListItemDto, PaginationMetaDto } from "../../content/dto";

export class PublicAuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  fullName!: string;

  @ApiPropertyOptional()
  username?: string;

  @ApiProperty()
  slug!: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiPropertyOptional()
  bannerUrl?: string | null;

  @ApiPropertyOptional()
  bio?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  totalPublishedVideos!: number;

  @ApiProperty()
  totalVideos!: number;

  @ApiProperty()
  totalViews!: number;

  @ApiProperty()
  subscriberCount!: number;

  @ApiProperty()
  authorUrl!: string;

  @ApiProperty({ enum: ["VERIFIED"] })
  verificationStatus!: "VERIFIED";
}

export class AuthorVideosQueryDto {
  @ApiPropertyOptional({
    enum: ["latest", "popular"],
    default: "latest",
  })
  @IsOptional()
  @IsIn(["latest", "popular"])
  sort?: "latest" | "popular" = "latest";

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 12, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 12;
}

export class AuthorVideosResponseDto {
  @ApiProperty({ type: [ContentListItemDto] })
  items!: ContentListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
