import {
  Controller,
  Body,
  Delete,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { AgeCategory } from "@prisma/client";
import { UserRole } from "@movie-platform/shared";

import { ContentService } from "./content.service";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import {
  CacheControl,
  CACHE_PRESETS,
} from "../../common/interceptors/cache-control.interceptor";
import { Roles } from "../../common/decorators/roles.decorator";
import { VerificationRequired } from "../../common/decorators/verification-required.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  ContentQueryDto,
  SearchQueryDto,
  ContentListResponseDto,
  ContentDetailDto,
  CategoryTreeResponseDto,
  TagDto,
  GenreDto,
} from "./dto";

@ApiTags("content")
@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * Get paginated content list with filters.
   * Public endpoint - returns content based on user's age (if authenticated).
   */
  @Public()
  @Get("content")
  @ApiOperation({ summary: "Get content list with filters" })
  @ApiResponse({
    status: 200,
    description: "Paginated content list",
    type: ContentListResponseDto,
  })
  async findAll(
    @Query() query: ContentQueryDto,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<ContentListResponseDto> {
    return this.contentService.findAll(query, userAgeCategory, verificationStatus);
  }

  /**
   * Search content by query string.
   * Public endpoint.
   */
  @Public()
  @Get("search")
  @ApiOperation({ summary: "Search content" })
  @ApiQuery({
    name: "q",
    description: "Search query",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "Search results",
    type: ContentListResponseDto,
  })
  async search(
    @Query() query: SearchQueryDto,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<ContentListResponseDto> {
    return this.contentService.search(query, userAgeCategory, verificationStatus);
  }

  /**
   * Get category tree.
   * Public endpoint.
   */
  @Public()
  @Get("categories")
  @CacheControl(CACHE_PRESETS.CDN_LONG)
  @ApiOperation({ summary: "Get category tree" })
  @ApiResponse({
    status: 200,
    description: "Category tree",
    type: CategoryTreeResponseDto,
  })
  async getCategories(): Promise<CategoryTreeResponseDto> {
    return this.contentService.getCategories();
  }

  /**
   * Get all tags.
   * Public endpoint.
   */
  @Public()
  @Get("tags")
  @ApiOperation({ summary: "Get all tags" })
  @ApiResponse({
    status: 200,
    description: "List of tags",
    type: [TagDto],
  })
  async getTags(): Promise<TagDto[]> {
    return this.contentService.getTags();
  }

  /**
   * Create a normalized tag for creator/admin content forms.
   */
  @Post("tags")
  @UseGuards(RolesGuard)
  @Roles(UserRole.PARTNER, UserRole.ADMIN, UserRole.MODERATOR)
  @VerificationRequired()
  @ApiOperation({ summary: "Create or reuse a normalized tag" })
  @ApiResponse({
    status: 201,
    description: "Created or existing tag",
    type: TagDto,
  })
  async createTag(@Body() body: { name: string }): Promise<TagDto> {
    return this.contentService.createOrFindTag(body.name);
  }

  /**
   * Get all genres.
   * Public endpoint.
   */
  @Public()
  @Get("genres")
  @ApiOperation({ summary: "Get all genres" })
  @ApiResponse({
    status: 200,
    description: "List of genres",
    type: [GenreDto],
  })
  async getGenres(): Promise<GenreDto[]> {
    return this.contentService.getGenres();
  }

  /**
   * Get single content by slug.
   * Public endpoint.
   */
  @Public()
  @Get("content/:slug")
  @ApiOperation({ summary: "Get content by slug" })
  @ApiParam({
    name: "slug",
    description: "Content slug",
  })
  @ApiResponse({
    status: 200,
    description: "Content details",
    type: ContentDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: "Content not found",
  })
  async findBySlug(
    @Param("slug") slug: string,
    @CurrentUser("ageCategory") userAgeCategory?: AgeCategory,
    @CurrentUser("id") userId?: string,
    @CurrentUser("role") userRole?: string,
    @CurrentUser("verificationStatus") verificationStatus?: string,
  ): Promise<ContentDetailDto> {
    return this.contentService.findBySlug(slug, userAgeCategory, {
      id: userId,
      role: userRole,
      verificationStatus,
    });
  }

  /**
   * Record a view for content.
   * Public endpoint - can be called anonymously.
   */
  @Public()
  @Get("content/:id/view")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Record content view" })
  @ApiParam({
    name: "id",
    description: "Content ID",
  })
  @ApiResponse({
    status: 204,
    description: "View recorded",
  })
  async recordView(@Param("id") id: string): Promise<void> {
    await this.contentService.incrementViewCount(id);
  }

  @Public()
  @Get("content/:id/next-episode")
  @ApiOperation({ summary: "Get next episode for a content item" })
  async getNextEpisode(
    @Param("id") id: string,
    @CurrentUser("id") userId?: string,
    @CurrentUser("role") role?: string,
  ) {
    return this.contentService.getNextEpisode(id, { id: userId, role });
  }

  @Public()
  @Get("content/:id/rating")
  @ApiOperation({ summary: "Get rating summary for a content item" })
  async getRating(@Param("id") id: string, @CurrentUser("id") userId?: string) {
    return this.contentService.getRatingSummary(id, userId);
  }

  @Post("content/:id/rating")
  @ApiOperation({ summary: "Create or update current user rating" })
  async rateContent(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body() body: { rating: number; comment?: string | null },
  ) {
    return this.contentService.upsertRating(id, userId, body);
  }

  @Get("content/:id/like")
  @ApiOperation({ summary: "Get current user like status for content" })
  async getLikeStatus(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.contentService.getLikeStatus(id, userId);
  }

  @Post("content/:id/like")
  @ApiOperation({ summary: "Like content as current user" })
  async likeContent(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.contentService.likeContent(id, userId);
  }

  @Delete("content/:id/like")
  @ApiOperation({ summary: "Remove current user like from content" })
  async unlikeContent(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.contentService.unlikeContent(id, userId);
  }
}
