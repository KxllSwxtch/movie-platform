import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@movie-platform/shared';

import { EdgeCenterService } from './edgecenter.service';
import { PrismaService } from '../../config/prisma.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerificationRequired } from '../../common/decorators/verification-required.decorator';
import {
  UploadUrlResponseDto,
  VideoThumbnailsDto,
  SetThumbnailDto,
  ThumbnailUpdateResponseDto,
  AdminVideoListDto,
} from './dto';

@ApiTags('admin/video')
@ApiBearerAuth()
@Controller('admin/content')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR, UserRole.AUTHOR)
@VerificationRequired()
export class EdgeCenterController {
  constructor(
    private readonly edgecenterService: EdgeCenterService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertCanManageContent(
    contentId: string,
    userId?: string,
    role?: string,
    options: { allowModerator?: boolean } = {},
  ) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, creatorId: true },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const canManageAll =
      role === UserRole.ADMIN ||
      (options.allowModerator === true && role === UserRole.MODERATOR);
    if (!canManageAll && content.creatorId !== userId) {
      throw new ForbiddenException('Insufficient permissions to manage content video');
    }
  }

  /**
   * Get video upload URL for content.
   * Creates a video entry in EdgeCenter CDN and returns TUS upload credentials.
   */
  @Post(':id/video/upload-url')
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Get video upload URL',
    description:
      'Creates a video entry in EdgeCenter CDN and returns TUS upload credentials for direct client upload. If content already has a video, it will be replaced.',
  })
  @ApiParam({ name: 'id', description: 'Content ID (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated successfully',
    type: UploadUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid content ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  @ApiResponse({ status: 500, description: 'Failed to create video in CDN' })
  async getUploadUrl(
    @Param('id') contentId: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') role?: string,
  ): Promise<UploadUrlResponseDto> {
    await this.assertCanManageContent(contentId, userId, role);
    return this.edgecenterService.getUploadUrl(contentId);
  }

  /**
   * Get available thumbnails for content video.
   */
  @Get(':id/video/thumbnails')
  @ApiOperation({
    summary: 'Get available thumbnails',
    description:
      'Returns all available thumbnail URLs from video encoding, including poster and screenshots.',
  })
  @ApiParam({ name: 'id', description: 'Content ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Thumbnails retrieved successfully',
    type: VideoThumbnailsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getThumbnails(
    @Param('id') contentId: string,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') role?: string,
  ): Promise<VideoThumbnailsDto> {
    await this.assertCanManageContent(contentId, userId, role, {
      allowModerator: true,
    });
    return this.edgecenterService.getThumbnailsForContent(contentId);
  }

  /**
   * Set primary thumbnail for content.
   */
  @Patch(':id/video/thumbnail')
  @Roles(UserRole.ADMIN, UserRole.AUTHOR)
  @ApiOperation({
    summary: 'Set primary thumbnail',
    description:
      'Sets the primary thumbnail for content from the available encoding thumbnails.',
  })
  @ApiParam({ name: 'id', description: 'Content ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Thumbnail updated successfully',
    type: ThumbnailUpdateResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid thumbnail URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async setThumbnail(
    @Param('id') contentId: string,
    @Body() dto: SetThumbnailDto,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') role?: string,
  ): Promise<ThumbnailUpdateResponseDto> {
    await this.assertCanManageContent(contentId, userId, role);
    await this.edgecenterService.setThumbnailForContent(contentId, dto.thumbnailUrl);
    return {
      success: true,
      message: 'Thumbnail updated successfully',
      thumbnailUrl: dto.thumbnailUrl,
    };
  }

  /**
   * Get admin video list with filtering and pagination.
   */
  @Get('videos')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({
    summary: 'Get admin video list',
    description:
      'Returns a paginated list of all content with video status for admin dashboard.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by encoding status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by content title' })
  @ApiQuery({ name: 'hasVideo', required: false, description: 'Filter by has video (true/false)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Video list retrieved successfully',
    type: AdminVideoListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getVideoList(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('hasVideo') hasVideo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<AdminVideoListDto> {
    return this.edgecenterService.getAdminVideoList({
      status,
      search,
      hasVideo: hasVideo ? hasVideo === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
