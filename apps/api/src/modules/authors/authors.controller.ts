import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AgeCategory } from "@prisma/client";

import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthorsService } from "./authors.service";
import {
  AuthorVideosQueryDto,
  AuthorVideosResponseDto,
  PublicAuthorDto,
} from "./dto/public-author.dto";

@ApiTags("authors")
@Controller()
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Public()
  @Get(["authors/:id", "author/:id", "channel/:id"])
  @ApiOperation({ summary: "Get public author profile" })
  @ApiParam({ name: "id", description: "Author ID" })
  @ApiResponse({ status: 200, type: PublicAuthorDto })
  @ApiResponse({ status: 404, description: "Author not found" })
  async getProfile(
    @Param("id") id: string,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<PublicAuthorDto> {
    return this.authorsService.getPublicProfile(
      id,
      userAgeCategory,
      verificationStatus,
    );
  }

  @Public()
  @Get(["authors/:id/videos", "author/:id/videos", "channel/:id/videos"])
  @ApiOperation({ summary: "Get public videos for an author" })
  @ApiParam({ name: "id", description: "Author ID" })
  @ApiResponse({ status: 200, type: AuthorVideosResponseDto })
  @ApiResponse({ status: 404, description: "Author not found" })
  async getVideos(
    @Param("id") id: string,
    @Query() query: AuthorVideosQueryDto,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<AuthorVideosResponseDto> {
    return this.authorsService.getPublicVideos(
      id,
      query,
      userAgeCategory,
      verificationStatus,
    );
  }

  @Public()
  @Get(["authors/:id/latest-videos", "author/:id/latest-videos", "channel/:id/latest-videos"])
  @ApiOperation({ summary: "Get latest public videos for an author" })
  async getLatestVideos(
    @Param("id") id: string,
    @Query() query: AuthorVideosQueryDto,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<AuthorVideosResponseDto> {
    return this.authorsService.getPublicVideos(
      id,
      { ...query, sort: "latest" },
      userAgeCategory,
      verificationStatus,
    );
  }

  @Public()
  @Get(["authors/:id/popular-videos", "author/:id/popular-videos", "channel/:id/popular-videos"])
  @ApiOperation({ summary: "Get popular public videos for an author" })
  async getPopularVideos(
    @Param("id") id: string,
    @Query() query: AuthorVideosQueryDto,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<AuthorVideosResponseDto> {
    return this.authorsService.getPublicVideos(
      id,
      { ...query, sort: "popular" },
      userAgeCategory,
      verificationStatus,
    );
  }

  @Public()
  @Get(["authors/:id/statistics", "author/:id/statistics", "channel/:id/statistics"])
  @ApiOperation({ summary: "Get public author statistics" })
  async getStatistics(
    @Param("id") id: string,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ) {
    const profile = await this.authorsService.getPublicProfile(
      id,
      userAgeCategory,
      verificationStatus,
    );

    return {
      totalViews: profile.totalViews,
      totalVideos: profile.totalVideos,
      totalPublishedVideos: profile.totalPublishedVideos,
      subscriberCount: profile.subscriberCount,
      registrationDate: profile.createdAt,
    };
  }
}
