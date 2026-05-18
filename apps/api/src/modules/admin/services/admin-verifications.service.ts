import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import { Readable } from 'stream';

import { PrismaService } from '../../../config/prisma.service';
import { StorageObjectStream, StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  AdminVerificationDto,
  AdminVerificationQueryDto,
  AdminVerificationListDto,
  AdminVerificationStatsDto,
} from '../dto/verification';

interface VerificationDocumentStream {
  stream: Readable;
  contentType: string;
  contentLength?: number;
  filename: string;
  documentKey: string;
}

@Injectable()
export class AdminVerificationsService {
  private readonly documentBucket = 'verification-documents';

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getVerifications(query: AdminVerificationQueryDto): Promise<AdminVerificationListDto> {
    const { status, method, search, page = 1, limit = 20 } = query;
    const where: Prisma.UserVerificationWhereInput = {};

    if (status) where.status = status;
    if (method) where.method = method;
    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, verifications] = await Promise.all([
      this.prisma.userVerification.count({ where }),
      this.prisma.userVerification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: this.verificationInclude(),
      }),
    ]);

    return {
      items: await Promise.all(verifications.map((v) => this.mapToDto(v))),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVerificationById(id: string): Promise<AdminVerificationDto> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id },
      include: this.verificationInclude(),
    });

    if (!verification) {
      throw new NotFoundException('Верификация не найдена');
    }

    return this.mapToDto(verification);
  }

  async getStats(): Promise<AdminVerificationStatsDto> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [pending, approved, rejected, total, overdueCount] = await Promise.all([
      this.prisma.userVerification.count({ where: { status: VerificationStatus.PENDING } }),
      this.prisma.userVerification.count({ where: { status: VerificationStatus.VERIFIED } }),
      this.prisma.userVerification.count({ where: { status: VerificationStatus.REJECTED } }),
      this.prisma.userVerification.count(),
      this.prisma.userVerification.count({
        where: {
          status: VerificationStatus.PENDING,
          createdAt: { lt: twentyFourHoursAgo },
        },
      }),
    ]);

    return { pending, approved, rejected, total, overdueCount };
  }

  async getDocumentStream(id: string, adminId: string): Promise<VerificationDocumentStream> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        documentKey: true,
        documentUrl: true,
      },
    });

    if (!verification) throw new NotFoundException('Verification not found');

    const documentKey = this.resolveVerificationDocumentKey(
      verification.documentKey,
      verification.documentUrl,
    );

    if (!documentKey) {
      throw new BadRequestException('This verification request has no document');
    }

    const object = await this.getStoredDocumentObject(documentKey);

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'VERIFICATION_DOCUMENT_VIEWED',
        entityType: 'UserVerification',
        entityId: verification.id,
        newValue: {
          targetUserId: verification.userId,
          documentKey,
        },
      },
    });

    return {
      stream: object.stream,
      contentType: object.contentType || this.inferContentType(documentKey),
      contentLength: object.contentLength,
      filename: this.getSafeFilename(documentKey),
      documentKey,
    };
  }

  async approveVerification(id: string, adminId: string): Promise<AdminVerificationDto> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!verification) throw new NotFoundException('Верификация не найдена');
    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException(`Заявка должна быть PENDING, текущий статус: ${verification.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedVerification = await tx.userVerification.update({
        where: { id },
        data: {
          status: VerificationStatus.VERIFIED,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
        include: this.verificationInclude(),
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: { verificationStatus: VerificationStatus.VERIFIED },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'VERIFICATION_APPROVED',
          entityType: 'UserVerification',
          entityId: id,
          oldValue: { status: VerificationStatus.PENDING },
          newValue: { status: VerificationStatus.VERIFIED },
        },
      });

      return updatedVerification;
    });

    await this.notificationsService.sendNotification({
      userId: verification.userId,
      title: 'Верификация одобрена',
      body: 'Ваш аккаунт успешно верифицирован.',
      data: { type: 'VERIFICATION_APPROVED', verificationId: id, path: '/account/verification' },
    });

    return this.mapToDto(updated);
  }

  async rejectVerification(
    id: string,
    reason: string,
    adminId: string,
  ): Promise<AdminVerificationDto> {
    const verification = await this.prisma.userVerification.findUnique({ where: { id } });

    if (!verification) throw new NotFoundException('Верификация не найдена');
    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException(`Заявка должна быть PENDING, текущий статус: ${verification.status}`);
    }
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Необходимо указать причину отклонения');
    }

    const rejectionReason = reason.trim();
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedVerification = await tx.userVerification.update({
        where: { id },
        data: {
          status: VerificationStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: new Date(),
          rejectionReason,
        },
        include: this.verificationInclude(),
      });

      await tx.user.update({
        where: { id: verification.userId },
        data: { verificationStatus: VerificationStatus.REJECTED },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: 'VERIFICATION_REJECTED',
          entityType: 'UserVerification',
          entityId: id,
          oldValue: { status: VerificationStatus.PENDING },
          newValue: { status: VerificationStatus.REJECTED, reason: rejectionReason },
        },
      });

      return updatedVerification;
    });

    await this.notificationsService.sendNotification({
      userId: verification.userId,
      title: 'Верификация отклонена',
      body: rejectionReason,
      data: { type: 'VERIFICATION_REJECTED', verificationId: id, path: '/account/verification' },
    });

    return this.mapToDto(updated);
  }

  private verificationInclude() {
    return {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          ageCategory: true,
          dateOfBirth: true,
          verificationStatus: true,
          verificationMethod: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      reviewedBy: { select: { email: true } },
      confirmedByPartner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      partnerRelationship: {
        select: {
          id: true,
          partnerId: true,
          referralId: true,
          level: true,
          createdAt: true,
        },
      },
    } satisfies Prisma.UserVerificationInclude;
  }

  private async mapToDto(verification: any): Promise<AdminVerificationDto> {
    const [payment, auditEventsCount] = await Promise.all([
      this.findVerificationPayment(verification.id, verification.userId),
      this.prisma.auditLog.count({
        where: { entityType: 'UserVerification', entityId: verification.id },
      }),
    ]);

    return {
      id: verification.id,
      userId: verification.userId,
      userEmail: verification.user.email,
      userAvatarUrl: verification.user.avatarUrl,
      userFirstName: verification.user.firstName,
      userLastName: verification.user.lastName,
      userRole: verification.user.role,
      userAgeCategory: verification.user.ageCategory,
      userDateOfBirth: verification.user.dateOfBirth,
      userCreatedAt: verification.user.createdAt,
      userUpdatedAt: verification.user.updatedAt,
      userVerificationStatus: verification.user.verificationStatus,
      method: verification.method,
      documentUrl: verification.documentUrl,
      documentKey: verification.documentKey,
      status: verification.status,
      reviewedByEmail: verification.reviewedBy?.email || null,
      reviewedAt: verification.reviewedAt,
      rejectionReason: verification.rejectionReason,
      confirmedByPartnerId:
        verification.confirmedByPartner?.id ||
        verification.confirmedByPartnerId ||
        null,
      confirmedByPartnerEmail: verification.confirmedByPartner?.email || null,
      confirmedAt: verification.confirmedAt,
      partnerRelationshipId: verification.partnerRelationshipId,
      payment,
      auditEventsCount,
      verifiedAt: verification.status === VerificationStatus.VERIFIED ? verification.reviewedAt : null,
      createdAt: verification.createdAt,
    };
  }

  private async findVerificationPayment(verificationId: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        userId,
        OR: [
          { metadata: { path: ['verificationId'], equals: verificationId } },
          { metadata: { path: ['purpose'], equals: 'verification' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!transaction) return null;

    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      externalPaymentId: transaction.externalPaymentId,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      metadata: transaction.metadata,
    };
  }

  private resolveVerificationDocumentKey(
    documentKey?: string | null,
    documentUrl?: string | null,
  ): string | null {
    if (documentKey) return documentKey;
    if (!documentUrl) return null;

    if (documentUrl.startsWith('minio://')) {
      const withoutScheme = documentUrl.replace('minio://', '');
      const parts = withoutScheme.split('/').filter(Boolean);
      if (parts[0] === this.documentBucket && parts.length > 1) {
        return parts.slice(1).join('/');
      }
      return parts.join('/') || null;
    }

    try {
      const url = new URL(documentUrl);
      const parts = url.pathname.split('/').filter(Boolean);
      const bucketIndex = parts.findIndex((part) => part === this.documentBucket);
      if (bucketIndex >= 0 && parts.length > bucketIndex + 1) {
        return parts.slice(bucketIndex + 1).join('/');
      }
    } catch {
      return null;
    }

    return null;
  }

  private inferContentType(documentKey: string): string {
    const extension = documentKey.split('.').pop()?.toLowerCase();
    const byExtension: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      pdf: 'application/pdf',
    };

    return byExtension[extension || ''] || 'application/octet-stream';
  }

  private getSafeFilename(documentKey: string): string {
    const filename = documentKey.split('/').pop() || 'verification-document';
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private async getStoredDocumentObject(documentKey: string): Promise<StorageObjectStream> {
    try {
      return await this.storageService.getObjectStream(this.documentBucket, documentKey);
    } catch (error: any) {
      if (
        error?.name === 'NoSuchKey' ||
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        throw new NotFoundException('Verification document file not found');
      }
      throw error;
    }
  }
}
