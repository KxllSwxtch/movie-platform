import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AgeCategory, ContentStatus, UserRole, VerificationStatus } from '@prisma/client';

import { AuthorsController } from '../src/modules/authors/authors.controller';
import { AuthorsService } from '../src/modules/authors/authors.service';
import { PrismaService } from '../src/config/prisma.service';

describe('Authors public endpoints (e2e)', () => {
  let app: INestApplication;
  let prisma: any;

  const author = {
    id: 'be729bbc-e786-42df-9c44-c5c730d5fc21',
    firstName: 'Test',
    lastName: 'Author',
    avatarUrl: null,
    bannerUrl: null,
    username: 'test4852',
    bio: null,
    createdAt: new Date('2026-05-29T21:45:58.435Z'),
  };

  beforeAll(async () => {
    prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(author),
      },
      content: {
        count: jest.fn().mockResolvedValue(2),
        aggregate: jest.fn().mockResolvedValue({ _sum: { viewCount: 7 } }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'content-1',
            title: 'Latest video',
            slug: 'latest-video',
            description: 'Description',
            contentType: 'CLIP',
            ageCategory: AgeCategory.SIX_PLUS,
            thumbnailUrl: null,
            previewUrl: null,
            duration: 60,
            isFree: true,
            individualPrice: null,
            viewCount: 7,
            publishedAt: new Date('2026-05-30T00:00:00.000Z'),
            createdAt: new Date('2026-05-29T00:00:00.000Z'),
            category: { id: 'cat-1', name: 'Category', slug: 'category' },
            tags: [],
            genres: [],
            _count: { comments: 0, likes: 0, ratings: 0 },
          },
        ]),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        AuthorsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each([
    '/api/v1/authors/be729bbc-e786-42df-9c44-c5c730d5fc21',
    '/api/v1/author/test4852',
    '/api/v1/channel/test4852',
  ])('returns a public author profile from %s', async (url) => {
    const response = await request(app.getHttpServer()).get(url).expect(200);

    expect(response.body.id).toBe(author.id);
    expect(response.body.username).toBe('test4852');
    expect(response.body.authorUrl).toBe('/author/test4852');
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ username: expect.any(String) }),
          ]),
          role: UserRole.AUTHOR,
          verificationStatus: VerificationStatus.VERIFIED,
        }),
      }),
    );
  });

  it.each([
    '/api/v1/authors/be729bbc-e786-42df-9c44-c5c730d5fc21/videos',
    '/api/v1/authors/be729bbc-e786-42df-9c44-c5c730d5fc21/latest-videos',
    '/api/v1/authors/be729bbc-e786-42df-9c44-c5c730d5fc21/popular-videos',
  ])('returns only published author videos from %s', async (url) => {
    const response = await request(app.getHttpServer()).get(url).expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ContentStatus.PUBLISHED,
        }),
      }),
    );
  });

  it('returns public author statistics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/authors/be729bbc-e786-42df-9c44-c5c730d5fc21/statistics')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        totalViews: 7,
        totalVideos: 2,
        totalPublishedVideos: 2,
        subscriberCount: 0,
      }),
    );
  });
});
