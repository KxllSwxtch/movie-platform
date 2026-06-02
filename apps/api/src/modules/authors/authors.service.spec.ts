import { NotFoundException } from "@nestjs/common";
import {
  AgeCategory,
  ContentStatus,
  UserRole,
  VerificationStatus,
} from "@prisma/client";

import { PrismaService } from "../../config/prisma.service";
import { AuthorsService } from "./authors.service";

describe("AuthorsService", () => {
  let service: AuthorsService;
  let prisma: MockPrisma;

  const author = {
    id: "author-1",
    firstName: "Ada",
    lastName: "Lovelace",
    avatarUrl: "avatars/author-1.png",
    bannerUrl: null,
    username: "ada_lovelace",
    bio: "Math and cinema.",
    createdAt: new Date("2026-01-10T00:00:00.000Z"),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      content: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new AuthorsService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns a public author profile", async () => {
    prisma.user.findFirst.mockResolvedValue(author);
    prisma.content.count.mockResolvedValue(3);
    prisma.content.aggregate.mockResolvedValue({ _sum: { viewCount: 42 } });

    const result = await service.getPublicProfile("author-1");

    expect(result).toEqual({
      id: "author-1",
      displayName: "Ada Lovelace",
      fullName: "Ada Lovelace",
      username: "ada_lovelace",
      slug: "ada_lovelace",
      avatarUrl: "avatars/author-1.png",
      bannerUrl: null,
      bio: "Math and cinema.",
      createdAt: author.createdAt,
      totalPublishedVideos: 3,
      totalVideos: 3,
      totalViews: 42,
      subscriberCount: 0,
      authorUrl: "/author/ada_lovelace",
      verificationStatus: "VERIFIED",
    });
  });

  it("throws NotFoundException when author is not found", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.getPublicProfile("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("hides unverified authors by requiring VERIFIED status", async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.getPublicProfile("author-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ id: "author-1" }, { username: "author-1" }],
        role: { in: [UserRole.AUTHOR, UserRole.ADMIN, UserRole.MODERATOR] },
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
  });

  it("allows verified admin creators to have public profiles", async () => {
    prisma.user.findFirst.mockResolvedValue({
      ...author,
      role: UserRole.ADMIN,
      username: null,
    });
    prisma.content.count.mockResolvedValue(2);
    prisma.content.aggregate.mockResolvedValue({ _sum: { viewCount: 12 } });

    const result = await service.getPublicProfile("author-1");

    expect(result.authorUrl).toBe("/authors/author-1");
    expect(result.totalVideos).toBe(2);
    expect(result.totalViews).toBe(12);
  });

  it("does not return private user fields", async () => {
    prisma.user.findFirst.mockResolvedValue({
      ...author,
      email: "ada@example.com",
      phone: "+10000000000",
      passwordHash: "secret",
    });
    prisma.content.count.mockResolvedValue(0);
    prisma.content.aggregate.mockResolvedValue({ _sum: { viewCount: null } });

    const result = await service.getPublicProfile("author-1");

    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("phone");
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("referralCode");
    expect(result).not.toHaveProperty("bonusBalance");
  });

  it("returns latest videos using only published public content", async () => {
    prisma.user.findFirst.mockResolvedValue(author);
    prisma.content.count.mockResolvedValue(1);
    prisma.content.findMany.mockResolvedValue([content("video-1", 10)]);

    const result = await service.getPublicVideos("author-1", {
      sort: "latest",
      page: 1,
      limit: 12,
    });

    expect(result.items).toHaveLength(1);
    expect(prisma.content.count).toHaveBeenCalledWith({
      where: {
        creatorId: "author-1",
        status: ContentStatus.PUBLISHED,
        ageCategory: {
          in: [
            AgeCategory.ZERO_PLUS,
            AgeCategory.SIX_PLUS,
            AgeCategory.TWELVE_PLUS,
            AgeCategory.SIXTEEN_PLUS,
          ],
        },
      },
    });
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          creatorId: "author-1",
          status: ContentStatus.PUBLISHED,
        }),
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      }),
    );
  });

  it("sorts popular videos by viewCount", async () => {
    prisma.user.findFirst.mockResolvedValue(author);
    prisma.content.count.mockResolvedValue(2);
    prisma.content.findMany.mockResolvedValue([
      content("popular", 200),
      content("less-popular", 20),
    ]);

    await service.getPublicVideos("author-1", {
      sort: "popular",
      page: 1,
      limit: 12,
    });

    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { viewCount: "desc" },
          { publishedAt: "desc" },
          { createdAt: "desc" },
        ],
      }),
    );
  });
});

type MockPrisma = {
  user: {
    findFirst: jest.Mock;
  };
  content: {
    count: jest.Mock;
    aggregate: jest.Mock;
    findMany: jest.Mock;
  };
};

function content(id: string, viewCount: number) {
  return {
    id,
    title: `Video ${id}`,
    slug: id,
    description: "Description",
    contentType: "CLIP",
    ageCategory: AgeCategory.SIX_PLUS,
    thumbnailUrl: null,
    previewUrl: null,
    duration: 60,
    isFree: true,
    individualPrice: null,
    viewCount,
    publishedAt: new Date("2026-02-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    category: { id: "category-1", name: "Category", slug: "category" },
    tags: [],
    genres: [],
    _count: { comments: 0, likes: 0, ratings: 0 },
  };
}
