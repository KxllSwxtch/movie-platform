import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserRole, VerificationStatus } from '@prisma/client';

import { VideoProcessingController } from '../src/modules/video-processing/video-processing.controller';
import { VideoProcessingService } from '../src/modules/video-processing/video-processing.service';
import { PrismaService } from '../src/config/prisma.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { VerificationGuard } from '../src/modules/auth/guards/verification.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { UsersService } from '../src/modules/users/users.service';
import { REDIS_CLIENT } from '../src/config/redis.module';
import { createMockRedis, MockRedis } from './mocks/redis.mock';
import { createAdultUser, createAdminUser, createAuthorUser, createPartnerUser } from './factories/user.factory';

describe('Video Upload Endpoints (e2e)', () => {
  let app: INestApplication;
  let mockRedis: MockRedis;
  let mockPrisma: any;
  let mockUsersService: any;
  let mockVideoProcessingService: any;
  let jwtService: JwtService;

  beforeAll(async () => {
    mockRedis = createMockRedis();

    mockPrisma = {
      content: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      videoFile: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    mockUsersService = {
      findById: jest.fn(),
    };

    mockVideoProcessingService = {
      enqueueTranscoding: jest.fn(),
      getEncodingStatus: jest.fn(),
      deleteVideoForContent: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET:
                process.env.JWT_SECRET ||
                'test-jwt-secret-key-for-testing-only-minimum-32-chars',
            }),
          ],
        }),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret:
            process.env.JWT_SECRET ||
            'test-jwt-secret-key-for-testing-only-minimum-32-chars',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [VideoProcessingController],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        VerificationGuard,
        Reflector,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: VerificationGuard },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VideoProcessingService, useValue: mockVideoProcessingService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedis.reset();
    mockPrisma.content.findUnique.mockResolvedValue({
      id: 'content-uuid-1',
      creatorId: 'content-owner-id',
    });
  });

  // Helper to generate auth token
  function generateToken(user: any) {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      ageCategory: user.ageCategory,
      verificationStatus: user.verificationStatus,
    });
  }

  // ============================================
  // POST /admin/content/:id/video/upload
  // ============================================
  describe('POST /admin/content/:id/video/upload', () => {
    const contentId = 'content-uuid-1';

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .expect(401);
    });

    it('should return 403 for CLIENT users', async () => {
      const regularUser = createAdultUser({
        role: UserRole.CLIENT,
        verificationStatus: VerificationStatus.VERIFIED,
      });
      mockUsersService.findById.mockResolvedValue(regularUser);

      const token = generateToken(regularUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 403 for PARTNER users', async () => {
      const partnerUser = createPartnerUser();
      mockUsersService.findById.mockResolvedValue(partnerUser);

      const token = generateToken(partnerUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(403);
    });

    it('should return 400 when no file is provided', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toContain('Видеофайл');
    });

    it('should return 201 and start transcoding for valid upload', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.enqueueTranscoding.mockResolvedValue({
        jobId: 'job-123',
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('job-123');
      expect(response.body.data.message).toContain('transcoding started');
    });

    it('should return 201 for AUTHOR uploading own content', async () => {
      const authorUser = createAuthorUser({ id: 'author-1' });
      mockUsersService.findById.mockResolvedValue(authorUser);
      mockPrisma.content.findUnique.mockResolvedValue({
        id: contentId,
        creatorId: authorUser.id,
      });
      mockVideoProcessingService.enqueueTranscoding.mockResolvedValue({
        jobId: 'job-author',
      });

      const token = generateToken(authorUser);

      const response = await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'author-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockVideoProcessingService.enqueueTranscoding).toHaveBeenCalled();
    });

    it('should return 403 for unverified AUTHOR uploading own content', async () => {
      const authorUser = createAdultUser({
        id: 'author-1',
        role: UserRole.AUTHOR,
        verificationStatus: VerificationStatus.UNVERIFIED,
      });
      mockUsersService.findById.mockResolvedValue(authorUser);
      mockPrisma.content.findUnique.mockResolvedValue({
        id: contentId,
        creatorId: authorUser.id,
      });

      const token = generateToken(authorUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'author-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(403);
    });

    it("should return 403 for AUTHOR uploading another author's content", async () => {
      const authorUser = createAuthorUser({ id: 'author-1' });
      mockUsersService.findById.mockResolvedValue(authorUser);
      mockPrisma.content.findUnique.mockResolvedValue({
        id: contentId,
        creatorId: 'author-2',
      });

      const token = generateToken(authorUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'other-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(403);
    });

    it('should call enqueueTranscoding with correct parameters', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.enqueueTranscoding.mockResolvedValue({
        jobId: 'job-456',
      });

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'my-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(201);

      expect(mockVideoProcessingService.enqueueTranscoding).toHaveBeenCalledWith(
        contentId,
        expect.stringMatching(/[\\/]tmp[\\/]video-uploads[\\/]/),
        'my-video.mp4',
      );
    });

    it('should return 404 when content does not exist', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockPrisma.content.findUnique.mockResolvedValue(null);

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .post(`/admin/content/nonexistent/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-video-data'), {
          filename: 'test-video.mp4',
          contentType: 'video/mp4',
        })
        .expect(404);
    });

    it('should accept WebM video format', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.enqueueTranscoding.mockResolvedValue({
        jobId: 'job-789',
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-webm-data'), {
          filename: 'test-video.webm',
          contentType: 'video/webm',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should accept QuickTime MOV format', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.enqueueTranscoding.mockResolvedValue({
        jobId: 'job-mov',
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-mov-data'), {
          filename: 'test-video.mov',
          contentType: 'video/quicktime',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject unsupported file formats', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .post(`/admin/content/${contentId}/video/upload`)
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('fake-audio-data'), {
          filename: 'audio.mp3',
          contentType: 'audio/mpeg',
        })
        .expect(400);
    });
  });

  // ============================================
  // GET /admin/content/:id/video/status
  // ============================================
  describe('GET /admin/content/:id/video/status', () => {
    const contentId = 'content-uuid-1';

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      const regularUser = createAdultUser({ role: UserRole.BUYER });
      mockUsersService.findById.mockResolvedValue(regularUser);

      const token = generateToken(regularUser);

      await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 200 with PENDING status when no video files exist', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.getEncodingStatus.mockResolvedValue({
        contentId,
        status: 'PENDING',
        availableQualities: [],
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.contentId).toBe(contentId);
      expect(response.body.status).toBe('PENDING');
      expect(response.body.availableQualities).toEqual([]);
    });

    it('should return 200 with PROCESSING status and progress', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.getEncodingStatus.mockResolvedValue({
        contentId,
        status: 'PROCESSING',
        availableQualities: [],
        progress: 65,
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('PROCESSING');
      expect(response.body.progress).toBe(65);
    });

    it('should return 200 with COMPLETED status and available qualities', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.getEncodingStatus.mockResolvedValue({
        contentId,
        status: 'COMPLETED',
        availableQualities: ['480p', '720p', '1080p'],
        thumbnailUrl: 'https://cdn.test/thumb.jpg',
        duration: 3600,
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.availableQualities).toEqual(['480p', '720p', '1080p']);
      expect(response.body.thumbnailUrl).toBe('https://cdn.test/thumb.jpg');
      expect(response.body.duration).toBe(3600);
    });

    it('should return 200 with FAILED status', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.getEncodingStatus.mockResolvedValue({
        contentId,
        status: 'FAILED',
        availableQualities: [],
        errorMessage: 'Invalid video format',
      });

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('FAILED');
    });

    it('should return 404 for non-existent content', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockPrisma.content.findUnique.mockResolvedValue(null);
      mockVideoProcessingService.getEncodingStatus.mockRejectedValue({
        status: 404,
        message: 'Content not found',
      });

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .get(`/admin/content/nonexistent/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should allow MODERATOR role to access encoding status', async () => {
      const moderatorUser = createAdultUser({ role: UserRole.MODERATOR });
      mockUsersService.findById.mockResolvedValue(moderatorUser);
      mockVideoProcessingService.getEncodingStatus.mockResolvedValue({
        contentId,
        status: 'COMPLETED',
        availableQualities: ['720p'],
      });

      const token = generateToken(moderatorUser);

      const response = await request(app.getHttpServer())
        .get(`/admin/content/${contentId}/video/status`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.status).toBe('COMPLETED');
    });
  });

  // ============================================
  // DELETE /admin/content/:id/video
  // ============================================
  describe('DELETE /admin/content/:id/video', () => {
    const contentId = 'content-uuid-1';

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      const regularUser = createAdultUser({ role: UserRole.BUYER });
      mockUsersService.findById.mockResolvedValue(regularUser);

      const token = generateToken(regularUser);

      await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should return 200 and delete video successfully', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.deleteVideoForContent.mockResolvedValue(undefined);

      const token = generateToken(adminUser);

      const response = await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should call deleteVideoForContent with correct content ID', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.deleteVideoForContent.mockResolvedValue(undefined);

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockVideoProcessingService.deleteVideoForContent).toHaveBeenCalledWith(
        contentId,
      );
    });

    it('should return 404 when content does not exist', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockPrisma.content.findUnique.mockResolvedValue(null);
      mockVideoProcessingService.deleteVideoForContent.mockRejectedValue({
        status: 404,
        message: 'Content not found',
      });

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .delete(`/admin/content/nonexistent/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 for MODERATOR role deleting video', async () => {
      const moderatorUser = createAdultUser({ role: UserRole.MODERATOR });
      mockUsersService.findById.mockResolvedValue(moderatorUser);
      mockVideoProcessingService.deleteVideoForContent.mockResolvedValue(undefined);

      const token = generateToken(moderatorUser);

      await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should handle service errors gracefully', async () => {
      const adminUser = createAdminUser();
      mockUsersService.findById.mockResolvedValue(adminUser);
      mockVideoProcessingService.deleteVideoForContent.mockRejectedValue(
        new Error('Storage connection failed'),
      );

      const token = generateToken(adminUser);

      await request(app.getHttpServer())
        .delete(`/admin/content/${contentId}/video`)
        .set('Authorization', `Bearer ${token}`)
        .expect(500);
    });
  });
});
