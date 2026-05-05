import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus, ContentType } from '@prisma/client';

import { PrismaService } from '../../config/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import {
  CreateSeriesContentDto,
  AddSeasonDto,
  AddEpisodeDto,
  UpdateEpisodeDto,
  UpdateStructureDto,
} from './dto';
import type {
  SeriesStructureResponseDto,
  SeriesSeasonResponseDto,
  SeriesEpisodeResponseDto,
} from './dto';

@Injectable()
export class SeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private canManageAll(actor?: { id?: string; role?: string }): boolean {
    return actor?.role === 'ADMIN' || actor?.role === 'MODERATOR';
  }

  private async assertCanManageContent(
    contentId: string,
    actor?: { id?: string; role?: string },
  ) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: { id: true, creatorId: true },
    });

    if (!content) {
      throw new NotFoundException(`Контент с ID "${contentId}" не найден`);
    }

    if (
      actor?.id &&
      !this.canManageAll(actor) &&
      content.creatorId !== actor.id
    ) {
      throw new ForbiddenException('Недостаточно прав для управления контентом');
    }
  }

  /**
   * Generate URL-friendly slug from title.
   */
  private generateSlug(title: string): string {
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0400-\u04FF\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${slug}-${Date.now().toString(36)}`;
  }

  /**
   * Create a series/tutorial with full season/episode structure in a single transaction.
   */
  async createWithStructure(
    dto: CreateSeriesContentDto,
    creatorId?: string,
  ): Promise<SeriesStructureResponseDto> {
    if (dto.contentType !== ContentType.SERIES && dto.contentType !== ContentType.TUTORIAL) {
      throw new BadRequestException('contentType must be SERIES or TUTORIAL');
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Категория с ID "${dto.categoryId}" не найдена`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create root Content
      const rootContent = await tx.content.create({
        data: {
          title: dto.title,
          slug: this.generateSlug(dto.title),
          description: dto.description,
          contentType: dto.contentType,
          categoryId: dto.categoryId,
          ageCategory: dto.ageCategory,
          thumbnailUrl: dto.thumbnailUrl,
          previewUrl: dto.previewUrl,
          creatorId,
          isFree: dto.isFree ?? false,
          individualPrice: dto.individualPrice,
          status: ContentStatus.DRAFT,
          tags: dto.tagIds?.length
            ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
            : undefined,
          genres: dto.genreIds?.length
            ? { create: dto.genreIds.map((genreId) => ({ genreId })) }
            : undefined,
        },
      });

      // 2. Create root Series record
      const rootSeries = await tx.series.create({
        data: {
          contentId: rootContent.id,
          seasonNumber: 0,
          episodeNumber: 0,
        },
      });

      // 3. Optionally create initial seasons/episodes for backwards compatibility.
      for (const season of dto.seasons ?? []) {
        const seasonRecord = await tx.contentSeason.create({
          data: {
            contentId: rootContent.id,
            seasonNumber: season.order,
            title: season.title || this.getDefaultSeasonTitle(dto.contentType, season.order),
          },
        });

        for (const episode of season.episodes) {
          const episodeContent = await tx.content.create({
            data: {
              title: episode.title,
              slug: this.generateSlug(`${dto.title}-s${season.order}e${episode.order}`),
              description: episode.description || '',
              contentType: dto.contentType,
              categoryId: dto.categoryId,
              ageCategory: dto.ageCategory,
              creatorId,
              status: ContentStatus.DRAFT,
            },
          });

          await tx.series.create({
            data: {
              contentId: episodeContent.id,
              seasonNumber: season.order,
              episodeNumber: episode.order,
              parentSeriesId: rootSeries.id,
              seasonId: seasonRecord.id,
            },
          });
        }
      }

      // Invalidate caches
      await this.cache.invalidatePattern('content:*');

      // Return full structure
      return this._getStructureFromTx(tx, rootContent.id);
    });
  }

  /**
   * Get the full season/episode tree for a series/tutorial.
   */
  async getStructure(
    contentId: string,
    actor?: { id?: string; role?: string },
  ): Promise<SeriesStructureResponseDto> {
    await this.assertCanManageContent(contentId, actor);
    return this._getStructureFromTx(this.prisma, contentId);
  }

  private async _getStructureFromTx(
    tx: any, // PrismaClient or transaction
    contentId: string,
  ): Promise<SeriesStructureResponseDto> {
    // Get root content
    const rootContent = await tx.content.findUnique({
      where: { id: contentId },
      include: {
        series: true,
      },
    });

    if (!rootContent) {
      throw new NotFoundException(`Контент с ID "${contentId}" не найден`);
    }

    if (!rootContent.series) {
      throw new BadRequestException('Этот контент не является сериалом или курсом');
    }

    const explicitSeasons = await tx.contentSeason.findMany({
      where: { contentId: rootContent.id },
      orderBy: { seasonNumber: 'asc' },
    });

    // Get all episodes (children of root series)
    const episodes = await tx.series.findMany({
      where: { parentSeriesId: rootContent.series.id },
      include: {
        content: {
          include: {
            videoFiles: {
              select: { encodingStatus: true },
            },
          },
        },
      },
      orderBy: [
        { seasonNumber: 'asc' },
        { episodeNumber: 'asc' },
      ],
    });

    // Group episodes by season number. Explicit seasons allow empty groups.
    const seasonMap = new Map<number, SeriesEpisodeResponseDto[]>();
    const seasonMeta = new Map<number, { id?: string; title: string }>();

    for (const season of explicitSeasons) {
      seasonMap.set(season.seasonNumber, []);
      seasonMeta.set(season.seasonNumber, {
        id: season.id,
        title: season.title,
      });
    }

    for (const ep of episodes) {
      const seasonNum = ep.seasonNumber;
      if (!seasonMap.has(seasonNum)) {
        seasonMap.set(seasonNum, []);
      }
      if (!seasonMeta.has(seasonNum)) {
        seasonMeta.set(seasonNum, {
          title: this.getDefaultSeasonTitle(rootContent.contentType, seasonNum),
        });
      }

      const hasVideo = !!ep.content.edgecenterVideoId || ep.content.videoFiles.length > 0;
      const encodingStatus = ep.content.videoFiles.length > 0
        ? ep.content.videoFiles[0].encodingStatus
        : undefined;

      seasonMap.get(seasonNum)!.push({
        id: ep.id,
        contentId: ep.content.id,
        seriesId: ep.id,
        title: ep.content.title,
        description: ep.content.description,
        seasonNumber: ep.seasonNumber,
        episodeNumber: ep.episodeNumber,
        hasVideo,
        encodingStatus,
        thumbnailUrl: ep.content.thumbnailUrl ?? undefined,
      });
    }

    // Build seasons array
    const seasons: SeriesSeasonResponseDto[] = [];
    const sortedSeasonNums = [...seasonMap.keys()].sort((a, b) => a - b);

    for (const seasonNum of sortedSeasonNums) {
      const meta = seasonMeta.get(seasonNum);

      seasons.push({
        id: meta?.id,
        seasonNumber: seasonNum,
        title: meta?.title ?? this.getDefaultSeasonTitle(rootContent.contentType, seasonNum),
        episodes: seasonMap.get(seasonNum)!,
      });
    }

    return {
      id: rootContent.id,
      title: rootContent.title,
      contentType: rootContent.contentType,
      seasons,
    };
  }

  /**
   * Add a season/chapter to an existing series/tutorial.
   */
  async addSeason(
    rootContentId: string,
    dto: AddSeasonDto,
    actor?: { id?: string; role?: string },
  ): Promise<SeriesSeasonResponseDto> {
    await this.assertCanManageContent(rootContentId, actor);

    const rootContent = await this.prisma.content.findUnique({
      where: { id: rootContentId },
      include: { series: true },
    });

    if (!rootContent || !rootContent.series || rootContent.series.parentSeriesId) {
      throw new NotFoundException('РЎРµСЂРёР°Р»/РєСѓСЂСЃ РЅРµ РЅР°Р№РґРµРЅ');
    }

    const seasonNumber = dto.seasonNumber ?? await this.getNextSeasonNumber(rootContentId);
    const title = dto.title || this.getDefaultSeasonTitle(rootContent.contentType, seasonNumber);

    const season = await this.prisma.contentSeason.create({
      data: {
        contentId: rootContentId,
        seasonNumber,
        title,
      },
    });

    await this.cache.invalidatePattern('content:*');

    return {
      id: season.id,
      seasonNumber: season.seasonNumber,
      title: season.title,
      episodes: [],
    };
  }

  /**
   * Add an episode to an existing series/tutorial.
   */
  async addEpisode(
    rootContentId: string,
    dto: AddEpisodeDto,
    actor?: { id?: string; role?: string },
  ): Promise<SeriesEpisodeResponseDto> {
    await this.assertCanManageContent(rootContentId, actor);

    const rootContent = await this.prisma.content.findUnique({
      where: { id: rootContentId },
      include: { series: true },
    });

    if (!rootContent || !rootContent.series) {
      throw new NotFoundException('Сериал/курс не найден');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const season = await tx.contentSeason.upsert({
        where: {
          contentId_seasonNumber: {
            contentId: rootContentId,
            seasonNumber: dto.seasonNumber,
          },
        },
        update: {},
        create: {
          contentId: rootContentId,
          seasonNumber: dto.seasonNumber,
          title: this.getDefaultSeasonTitle(rootContent.contentType, dto.seasonNumber),
        },
      });

      const episodeNumber = dto.episodeNumber
        ?? await this.getNextEpisodeNumber(rootContent.series!.id, dto.seasonNumber);

      const episodeContent = await tx.content.create({
        data: {
          title: dto.title,
          slug: this.generateSlug(`${rootContent.title}-s${dto.seasonNumber}e${episodeNumber}`),
          description: dto.description || '',
          contentType: rootContent.contentType,
          categoryId: rootContent.categoryId,
          ageCategory: rootContent.ageCategory,
          creatorId: rootContent.creatorId,
          status: ContentStatus.DRAFT,
        },
      });

      const series = await tx.series.create({
        data: {
          contentId: episodeContent.id,
          seasonNumber: dto.seasonNumber,
          episodeNumber,
          parentSeriesId: rootContent.series!.id,
          seasonId: season.id,
        },
      });

      return { series, episodeContent, episodeNumber };
    });

    await this.cache.invalidatePattern('content:*');

    return {
      id: result.series.id,
      contentId: result.episodeContent.id,
      seriesId: result.series.id,
      title: result.episodeContent.title,
      description: result.episodeContent.description,
      seasonNumber: dto.seasonNumber,
      episodeNumber: result.episodeNumber,
      hasVideo: false,
      thumbnailUrl: undefined,
    };
  }

  /**
   * Update an episode's metadata.
   */
  async updateEpisode(
    episodeContentId: string,
    dto: UpdateEpisodeDto,
    actor?: { id?: string; role?: string },
  ): Promise<void> {
    await this.assertCanManageContent(episodeContentId, actor);

    const content = await this.prisma.content.findUnique({
      where: { id: episodeContentId },
      include: { series: true },
    });

    if (!content || !content.series || !content.series.parentSeriesId) {
      throw new NotFoundException('Эпизод не найден');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (Object.keys(updateData).length > 0) {
      await this.prisma.content.update({
        where: { id: episodeContentId },
        data: updateData,
      });
      await this.cache.invalidatePattern('content:*');
    }
  }

  /**
   * Delete an episode (Content + Series cascade).
   */
  async deleteEpisode(
    episodeContentId: string,
    actor?: { id?: string; role?: string },
  ): Promise<void> {
    await this.assertCanManageContent(episodeContentId, actor);

    const content = await this.prisma.content.findUnique({
      where: { id: episodeContentId },
      include: { series: true },
    });

    if (!content || !content.series || !content.series.parentSeriesId) {
      throw new NotFoundException('Эпизод не найден');
    }

    // Delete Content (Series cascades via onDelete: Cascade)
    await this.prisma.content.delete({
      where: { id: episodeContentId },
    });

    await this.cache.invalidatePattern('content:*');
  }

  /**
   * Bulk reorder episodes within a series.
   */
  async reorderStructure(
    rootContentId: string,
    dto: UpdateStructureDto,
    actor?: { id?: string; role?: string },
  ): Promise<void> {
    await this.assertCanManageContent(rootContentId, actor);

    const rootContent = await this.prisma.content.findUnique({
      where: { id: rootContentId },
      include: { series: true },
    });

    if (!rootContent || !rootContent.series) {
      throw new NotFoundException('Сериал/курс не найден');
    }

    // Update each episode's seasonNumber and episodeNumber
    await this.prisma.$transaction(
      dto.episodes.map((ep) =>
        this.prisma.series.updateMany({
          where: { contentId: ep.id, parentSeriesId: rootContent.series!.id },
          data: {
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
          },
        }),
      ),
    );

    await this.cache.invalidatePattern('content:*');
  }

  private getDefaultSeasonTitle(contentType: ContentType, seasonNumber: number): string {
    return contentType === ContentType.TUTORIAL
      ? `Глава ${seasonNumber}`
      : `Сезон ${seasonNumber}`;
  }

  private async getNextSeasonNumber(rootContentId: string): Promise<number> {
    const [lastSeason, lastEpisodeSeason] = await Promise.all([
      this.prisma.contentSeason.findFirst({
        where: { contentId: rootContentId },
        orderBy: { seasonNumber: 'desc' },
        select: { seasonNumber: true },
      }),
      this.prisma.series.findFirst({
        where: { parentSeries: { contentId: rootContentId } },
        orderBy: { seasonNumber: 'desc' },
        select: { seasonNumber: true },
      }),
    ]);

    return Math.max(lastSeason?.seasonNumber ?? 0, lastEpisodeSeason?.seasonNumber ?? 0) + 1;
  }

  private async getNextEpisodeNumber(rootSeriesId: string, seasonNumber: number): Promise<number> {
    const lastEpisode = await this.prisma.series.findFirst({
      where: { parentSeriesId: rootSeriesId, seasonNumber },
      orderBy: { episodeNumber: 'desc' },
      select: { episodeNumber: true },
    });

    return (lastEpisode?.episodeNumber ?? 0) + 1;
  }
}
