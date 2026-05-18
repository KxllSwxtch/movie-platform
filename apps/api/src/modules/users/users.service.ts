import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { VerificationStatus, VerificationMethod } from '@movie-platform/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentMethodType,
  TransactionType,
} from '@prisma/client';
import {
  CreateBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { PrismaService } from '../../config/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PaymentsService } from '../payments/payments.service';
import { TokenService } from '../auth/token.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { VerificationSubmissionDto } from './dto/verification-submission.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const AVATAR_BUCKET = 'avatars';
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const VERIFICATION_DOCUMENT_BUCKET = 'verification-documents';
const ALLOWED_VERIFICATION_DOCUMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_VERIFICATION_DOCUMENT_SIZE = 10 * 1024 * 1024;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private bucketEnsured = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly paymentsService: PaymentsService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Find a user by ID.
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by email.
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find a user by referral code.
   */
  async findByReferralCode(code: string) {
    return this.prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
    });
  }

  /**
   * Get user profile (sanitized, without sensitive data).
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Filter out undefined values
    const updateData: Record<string, any> = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    if (Object.keys(updateData).length === 0) {
      return this.sanitizeUser(user);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Change user password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, rounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  /**
   * Submit verification request.
   */
  async submitVerification(userId: string, dto: VerificationSubmissionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has pending or approved verification
    if (user.verificationStatus === VerificationStatus.PENDING) {
      throw new ConflictException('You already have a pending verification request');
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new ConflictException('You are already verified');
    }

    if (dto.method === VerificationMethod.DOCUMENT && !dto.documentKey) {
      throw new BadRequestException('Document upload is required for document verification');
    }

    if (dto.documentUrl) {
      throw new BadRequestException('External document URLs are not accepted');
    }

    if (dto.method === VerificationMethod.DOCUMENT) {
      await this.assertVerificationDocumentOwnership(userId, dto.documentKey!);
    }

    if (dto.method === VerificationMethod.PAYMENT) {
      if (!dto.paymentMethod) {
        throw new BadRequestException('Payment method is required for payment verification');
      }
      return this.createPaymentVerification(userId, dto.paymentMethod, dto.returnUrl);
    }

    const partnerRelationship =
      dto.method === VerificationMethod.THIRD_PARTY
        ? await this.prisma.partnerRelationship.findFirst({
            where: { referralId: userId, level: 1 },
            include: {
              partner: {
                select: { id: true, email: true, firstName: true, lastName: true },
              },
            },
          })
        : null;

    if (dto.method === VerificationMethod.THIRD_PARTY && !partnerRelationship) {
      throw new BadRequestException(
        'Partner verification is available only for users with a direct partner relationship',
      );
    }

    // Create verification record
    const verification = await this.prisma.userVerification.create({
      data: {
        userId,
        method: dto.method,
        documentKey: dto.documentKey,
        status: VerificationStatus.PENDING,
        partnerRelationshipId: partnerRelationship?.id,
      },
    });

    // Update user verification status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: VerificationStatus.PENDING,
        verificationMethod: dto.method,
      },
    });

    if (dto.method === VerificationMethod.THIRD_PARTY && partnerRelationship) {
      await this.notificationsService.sendNotification({
        userId: partnerRelationship.partnerId,
        title: 'Новый запрос на подтверждение',
        body: `${user.firstName} ${user.lastName} запросил верификацию через партнера. Проверьте заявку в партнерском кабинете.`,
        data: {
          type: 'VERIFICATION_PARTNER_REQUEST',
          verificationId: verification.id,
          targetUserId: userId,
          path: '/partner/referrals',
        },
      });
    }

    await this.notifyModeratorsAboutVerification(verification.id, userId, dto.method);

    return {
      status: VerificationStatus.PENDING,
      method: dto.method,
      submittedAt: verification.createdAt,
    };
  }

  async uploadVerificationDocument(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationStatus: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verificationStatus === VerificationStatus.PENDING) {
      throw new ConflictException('You already have a pending verification request');
    }

    if (user.verificationStatus === VerificationStatus.VERIFIED) {
      throw new ConflictException('You are already verified');
    }

    if (!ALLOWED_VERIFICATION_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Allowed formats: JPEG, PNG, WebP, PDF');
    }

    if (file.size > MAX_VERIFICATION_DOCUMENT_SIZE) {
      throw new BadRequestException('Maximum document size is 10MB');
    }

    await this.storageService.ensureBucket(VERIFICATION_DOCUMENT_BUCKET);

    const ext = this.getSafeDocumentExtension(file);
    const documentKey = `${userId}/${uuidv4()}${ext}`;

    await this.storageService.uploadFile(
      VERIFICATION_DOCUMENT_BUCKET,
      documentKey,
      file.buffer,
      file.mimetype,
    );

    return {
      documentKey,
      filename: file.originalname,
      contentType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Get verification status.
   */
  async getVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the latest verification record
    const verification = await this.prisma.userVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      status: user.verificationStatus,
      method: user.verificationMethod,
      rejectionReason: verification?.rejectionReason,
      submittedAt: verification?.createdAt,
      reviewedAt: verification?.reviewedAt,
    };
  }

  /**
   * Get user's active sessions.
   */
  async getActiveSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user's referral statistics.
   */
  async getReferralStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Count direct referrals
    const directReferrals = await this.prisma.user.count({
      where: { referredById: userId },
    });

    // Get partner relationship count at each level
    const levelCounts = await this.prisma.partnerRelationship.groupBy({
      by: ['level'],
      where: { partnerId: userId },
      _count: true,
    });

    const teamByLevel: Record<number, number> = {};
    for (const levelCount of levelCounts) {
      teamByLevel[levelCount.level] = levelCount._count as unknown as number;
    }

    // Get total team size
    const totalTeam = await this.prisma.partnerRelationship.count({
      where: { partnerId: userId },
    });

    return {
      referralCode: user.referralCode,
      directReferrals,
      totalTeam,
      teamByLevel,
    };
  }

  /**
   * Get user watchlist (auto-creates "Избранное" playlist if not exists).
   */
  async getWatchlist(userId: string, page: number, limit: number) {
    // Find or create the "Избранное" playlist
    let playlist = await this.prisma.playlist.findFirst({
      where: { userId, name: 'Избранное' },
    });

    if (!playlist) {
      playlist = await this.prisma.playlist.create({
        data: { userId, name: 'Избранное', isPublic: false },
      });
    }

    const [items, total] = await Promise.all([
      this.prisma.playlistItem.findMany({
        where: { playlistId: playlist.id },
        include: {
          content: {
            select: {
              id: true,
              title: true,
              slug: true,
              contentType: true,
              thumbnailUrl: true,
              duration: true,
              ageCategory: true,
            },
          },
        },
        orderBy: { order: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.playlistItem.count({ where: { playlistId: playlist.id } }),
    ]);

    return {
      items: items.map((item) => ({
        contentId: item.contentId,
        ...item.content,
        addedOrder: item.order,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add content to watchlist.
   */
  async addToWatchlist(userId: string, contentId: string) {
    // Find or create the "Избранное" playlist
    let playlist = await this.prisma.playlist.findFirst({
      where: { userId, name: 'Избранное' },
    });

    if (!playlist) {
      playlist = await this.prisma.playlist.create({
        data: { userId, name: 'Избранное', isPublic: false },
      });
    }

    // Check if already in watchlist
    const existing = await this.prisma.playlistItem.findUnique({
      where: {
        playlistId_contentId: { playlistId: playlist.id, contentId },
      },
    });

    if (existing) {
      return { message: 'Already in watchlist' };
    }

    // Get next order number
    const maxOrder = await this.prisma.playlistItem.aggregate({
      where: { playlistId: playlist.id },
      _max: { order: true },
    });

    await this.prisma.playlistItem.create({
      data: {
        playlistId: playlist.id,
        contentId,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return { message: 'Added to watchlist' };
  }

  /**
   * Remove content from watchlist.
   */
  async removeFromWatchlist(userId: string, contentId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { userId, name: 'Избранное' },
    });

    if (!playlist) {
      throw new NotFoundException('Watchlist not found');
    }

    await this.prisma.playlistItem.deleteMany({
      where: { playlistId: playlist.id, contentId },
    });

    return { message: 'Removed from watchlist' };
  }

  /**
   * Terminate a specific session.
   */
  async terminateSession(userId: string, sessionId: string) {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.delete({
      where: { id: sessionId },
    });

    return { message: 'Session terminated' };
  }

  /**
   * Terminate all sessions except the current one.
   */
  async terminateAllSessions(userId: string, currentSessionId?: string) {
    const where: Record<string, unknown> = { userId };

    if (currentSessionId) {
      where.id = { not: currentSessionId };
    }

    const result = await this.prisma.userSession.deleteMany({ where });

    return { message: `${result.count} session(s) terminated` };
  }

  /**
   * Request email change — sends OTP code to the new email.
   */
  async requestEmailChange(userId: string, newEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const normalized = newEmail.toLowerCase().trim();

    if (normalized === user.email) {
      throw new BadRequestException('Новый email совпадает с текущим');
    }

    // Check if email is already taken
    const existing = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      throw new ConflictException('Этот email уже используется');
    }

    const code = await this.tokenService.generateEmailChangeCode(userId, normalized);

    await this.emailService.sendEmailChangeCode(
      user.firstName || 'Пользователь',
      normalized,
      code,
    );

    return { message: 'Код подтверждения отправлен на новый email' };
  }

  /**
   * Confirm email change with OTP code.
   */
  async confirmEmailChange(userId: string, code: string) {
    const newEmail = await this.tokenService.validateEmailChangeCode(userId, code);

    // Double-check email not taken (race condition guard)
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing) {
      throw new ConflictException('Этот email уже используется');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Upload user avatar image.
   */
  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate file type
    if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Допустимые форматы: JPEG, PNG, WebP',
      );
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      throw new BadRequestException(
        'Максимальный размер файла: 5 МБ',
      );
    }

    // Ensure avatars bucket exists
    await this.ensureBucket();

    // Generate storage key
    const ext = file.originalname?.split('.').pop() || 'jpg';
    const key = `${userId}/${uuidv4()}.${ext}`;

    // Upload to MinIO
    const avatarUrl = await this.storageService.uploadFile(
      AVATAR_BUCKET,
      key,
      file.buffer,
      file.mimetype,
    );

    // Delete old avatar from storage if it's in our MinIO
    if (user.avatarUrl) {
      try {
        const publicEndpoint = this.configService.get<string>(
          'MINIO_PUBLIC_ENDPOINT',
          'http://localhost:9000',
        );
        if (user.avatarUrl.startsWith(`${publicEndpoint}/${AVATAR_BUCKET}/`)) {
          const oldKey = user.avatarUrl
            .replace(`${publicEndpoint}/${AVATAR_BUCKET}/`, '');
          await this.storageService.deleteFile(AVATAR_BUCKET, oldKey);
        }
      } catch (err) {
        this.logger.warn(`Failed to delete old avatar: ${err}`);
      }
    }

    // Update user record
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return this.sanitizeUser(updatedUser);
  }

  /**
   * Ensure the avatars bucket exists in MinIO (idempotent).
   */
  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) return;

    try {
      const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'http://localhost:9000');
      const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
      const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin123');

      const s3 = new S3Client({
        endpoint,
        region: 'us-east-1',
        forcePathStyle: true,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });

      await s3.send(new CreateBucketCommand({ Bucket: AVATAR_BUCKET }));
      this.logger.log(`Created bucket: ${AVATAR_BUCKET}`);
    } catch (err: any) {
      // BucketAlreadyOwnedByYou / BucketAlreadyExists — safe to ignore
      if (
        err?.name === 'BucketAlreadyOwnedByYou' ||
        err?.name === 'BucketAlreadyExists' ||
        err?.Code === 'BucketAlreadyOwnedByYou'
      ) {
        // Bucket already exists
      } else {
        this.logger.warn(`ensureBucket error (non-critical): ${err?.message}`);
      }
    }

    this.bucketEnsured = true;
  }

  private async createPaymentVerification(
    userId: string,
    paymentMethod: PaymentMethodType,
    returnUrl?: string,
  ) {
    const amount = Number(process.env.VERIFICATION_PAYMENT_AMOUNT || 10);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Verification payment amount is not configured');
    }

    const verification = await this.prisma.$transaction(async (tx) => {
      const created = await tx.userVerification.create({
        data: {
          userId,
          method: VerificationMethod.PAYMENT,
          status: VerificationStatus.PENDING,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          verificationStatus: VerificationStatus.PENDING,
          verificationMethod: VerificationMethod.PAYMENT,
        },
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'VERIFICATION_PAYMENT_STARTED',
          entityType: 'UserVerification',
          entityId: created.id,
          oldValue: { status: VerificationStatus.UNVERIFIED },
          newValue: {
            status: VerificationStatus.PENDING,
            method: VerificationMethod.PAYMENT,
          },
        },
      });

      return created;
    });

    const payment = await this.paymentsService.initiatePayment(userId, {
      type: TransactionType.VERIFICATION,
      amount,
      paymentMethod,
      returnUrl,
      referenceId: verification.id,
      metadata: {
        purpose: 'verification',
        verificationId: verification.id,
      },
    });

    return {
      status: VerificationStatus.PENDING,
      method: VerificationMethod.PAYMENT,
      submittedAt: verification.createdAt,
      payment,
    };
  }

  private async assertVerificationDocumentOwnership(
    userId: string,
    documentKey: string,
  ) {
    if (!documentKey.startsWith(`${userId}/`)) {
      throw new BadRequestException('Document does not belong to current user');
    }

    const exists = await this.storageService.fileExists(
      VERIFICATION_DOCUMENT_BUCKET,
      documentKey,
    );

    if (!exists) {
      throw new BadRequestException('Verification document was not found');
    }
  }

  private async notifyModeratorsAboutVerification(
    verificationId: string,
    userId: string,
    method: VerificationMethod,
  ) {
    const moderators = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MODERATOR'] } },
      select: { id: true },
    });

    await Promise.all(
      moderators.map((moderator) =>
        this.notificationsService.sendNotification({
          userId: moderator.id,
          title: 'Новая заявка на верификацию',
          body:
            method === VerificationMethod.THIRD_PARTY
              ? 'Пользователь запросил подтверждение через партнера. Финальное решение остается за модератором.'
              : 'Пользователь отправил заявку на ручную проверку.',
          data: {
            type: 'VERIFICATION_ADMIN_REVIEW',
            verificationId,
            targetUserId: userId,
            method,
            path: '/admin/verifications',
          },
        }),
      ),
    );
  }

  private getSafeDocumentExtension(file: Express.Multer.File): string {
    const byMime: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };

    return byMime[file.mimetype] || '.bin';
  }

  /**
   * Sanitize user object (remove sensitive fields).
   */
  private sanitizeUser(user: any) {
    const {
      passwordHash,
      isActive,
      referredById,
      ...sanitized
    } = user;

    return {
      ...sanitized,
      bonusBalance: Number(sanitized.bonusBalance),
    };
  }
}
