import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AgeCategory,
  ContentStatus,
  Content,
  ContentGenre,
  ContentTag,
  Genre,
  Prisma,
  Tag,
  UserRole,
  VerificationStatus,
  Category,
} from "@prisma/client";
import { AgeCategory as SharedAgeCategory } from "@movie-platform/shared";
import { ContentType as SharedContentType } from "@movie-platform/shared";

import { PrismaService } from "../../config/prisma.service";
import { AuthorVideosQueryDto } from "./dto/public-author.dto";

@Injectable()
export class AuthorsService {
  private readonly AGE_CATEGORY_MAP: Record<AgeCategory, SharedAgeCategory> = {
    [AgeCategory.ZERO_PLUS]: SharedAgeCategory.ZERO_PLUS,
    [AgeCategory.SIX_PLUS]: SharedAgeCategory.SIX_PLUS,
    [AgeCategory.TWELVE_PLUS]: SharedAgeCategory.TWELVE_PLUS,
    [AgeCategory.SIXTEEN_PLUS]: SharedAgeCategory.SIXTEEN_PLUS,
    [AgeCategory.EIGHTEEN_PLUS]: SharedAgeCategory.EIGHTEEN_PLUS,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(
    authorId: string,
    userAgeCategory?: AgeCategory,
    verificationStatus?: string,
  ) {
    const author = await this.findPublicAuthor(authorId);
    const publicContentWhere = this.publicContentWhere(
      author.id,
      this.getAllowedAgeCategories(userAgeCategory, verificationStatus),
    );

    const [totalPublishedVideos, viewsAggregate] = await Promise.all([
      this.prisma.content.count({ where: publicContentWhere }),
      this.prisma.content.aggregate({
        where: publicContentWhere,
        _sum: { viewCount: true },
      }),
    ]);

    return {
      id: author.id,
      displayName: this.getDisplayName(author),
      fullName: this.getDisplayName(author),
      username: author.username ?? undefined,
      slug: author.username ?? author.id,
      avatarUrl: author.avatarUrl,
      bannerUrl: author.bannerUrl,
      bio: author.bio,
      createdAt: author.createdAt,
      totalPublishedVideos,
      totalVideos: totalPublishedVideos,
      totalViews: viewsAggregate._sum.viewCount ?? 0,
      subscriberCount: 0,
      authorUrl: `/author/${author.username ?? author.id}`,
      verificationStatus: "VERIFIED" as const,
    };
  }

  async getPublicVideos(
    authorId: string,
    query: AuthorVideosQueryDto,
    userAgeCategory?: AgeCategory,
    verificationStatus?: string,
  ) {
    const author = await this.findPublicAuthor(authorId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const sort = query.sort ?? "latest";
    const where = this.publicContentWhere(
      author.id,
      this.getAllowedAgeCategories(userAgeCategory, verificationStatus),
    );

    const orderBy: Prisma.ContentOrderByWithRelationInput[] =
      sort === "popular"
        ? [{ viewCount: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }]
        : [{ publishedAt: "desc" }, { createdAt: "desc" }];

    const [total, items] = await Promise.all([
      this.prisma.content.count({ where }),
      this.prisma.content.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          tags: {
            include: { tag: { select: { id: true, name: true, slug: true } } },
          },
          genres: {
            include: {
              genre: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { comments: true, likes: true, ratings: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: items.map((item) => this.mapContentToPublicDto(item)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private async findPublicAuthor(authorIdOrUsername: string) {
    const author = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: authorIdOrUsername }, { username: authorIdOrUsername }],
        role: UserRole.AUTHOR,
        verificationStatus: VerificationStatus.VERIFIED,
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        bannerUrl: true,
        username: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!author) {
      throw new NotFoundException("Author not found");
    }

    return author;
  }

  private publicContentWhere(
    authorId: string,
    ageCategories?: AgeCategory[],
  ): Prisma.ContentWhereInput {
    return {
      creatorId: authorId,
      status: ContentStatus.PUBLISHED,
      ...(ageCategories ? { ageCategory: { in: ageCategories } } : {}),
    };
  }

  private getAllowedAgeCategories(
    userAgeCategory?: AgeCategory,
    verificationStatus?: string,
  ): AgeCategory[] {
    const order = [
      AgeCategory.ZERO_PLUS,
      AgeCategory.SIX_PLUS,
      AgeCategory.TWELVE_PLUS,
      AgeCategory.SIXTEEN_PLUS,
      AgeCategory.EIGHTEEN_PLUS,
    ];

    if (!userAgeCategory) {
      return [
        AgeCategory.ZERO_PLUS,
        AgeCategory.SIX_PLUS,
        AgeCategory.TWELVE_PLUS,
        AgeCategory.SIXTEEN_PLUS,
      ];
    }

    const allowed = order.slice(0, order.indexOf(userAgeCategory) + 1);
    if (verificationStatus !== VerificationStatus.VERIFIED) {
      return allowed.filter((category) => category !== AgeCategory.EIGHTEEN_PLUS);
    }

    return allowed;
  }

  private getDisplayName(author: {
    firstName: string;
    lastName: string;
    username?: string | null;
  }) {
    return (
      [author.firstName, author.lastName].filter(Boolean).join(" ") ||
      author.username ||
      "Author"
    );
  }

  private mapContentToPublicDto(content: PublicContentRecord) {
    return {
      id: content.id,
      title: content.title,
      slug: content.slug,
      description: content.description,
      contentType: content.contentType as SharedContentType,
      ageCategory:
        this.AGE_CATEGORY_MAP[content.ageCategory as AgeCategory] ??
        content.ageCategory,
      thumbnailUrl: content.thumbnailUrl ?? undefined,
      previewUrl: content.previewUrl ?? undefined,
      duration: content.duration,
      isFree: content.isFree,
      individualPrice: content.individualPrice
        ? Number(content.individualPrice)
        : undefined,
      viewCount: content.viewCount,
      publishedAt: content.publishedAt ?? undefined,
      uploadedAt: content.createdAt,
      category: content.category,
      tags: Array.isArray(content.tags)
        ? content.tags.map((ct) => ct.tag)
        : [],
      genres: Array.isArray(content.genres)
        ? content.genres.map((cg) => cg.genre)
        : [],
      commentCount:
        typeof content?._count?.comments === "number"
          ? content._count.comments
          : undefined,
      likeCount:
        typeof content?._count?.likes === "number" ? content._count.likes : 0,
      ratingCount:
        typeof content?._count?.ratings === "number"
          ? content._count.ratings
          : 0,
      reviewsCount:
        typeof content?._count?.ratings === "number"
          ? content._count.ratings
          : 0,
      shareCount: 0,
    };
  }
}

type PublicContentRecord = Content & {
  category: Pick<Category, "id" | "name" | "slug">;
  tags: Array<ContentTag & { tag: Pick<Tag, "id" | "name" | "slug"> }>;
  genres: Array<ContentGenre & { genre: Pick<Genre, "id" | "name" | "slug"> }>;
  _count?: {
    comments?: number;
    likes?: number;
    ratings?: number;
  };
};
