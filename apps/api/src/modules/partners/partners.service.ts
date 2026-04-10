import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  CommissionStatus,
  Prisma,
  TaxStatus,
  TransactionStatus,
  VerificationMethod,
  VerificationStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { PrismaService } from '../../config/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { COMMISSION_RATES_BY_DEPTH, PARTNER_LEVELS, TAX_RATES } from '@movie-platform/shared';
import {
  AvailableBalanceDto,
  CommissionDto,
  CommissionQueryDto,
  CreateWithdrawalDto,
  PartnerDashboardDto,
  PartnerLevelDto,
  ReferralNodeDto,
  ReferralTreeDto,
  TaxCalculationDto,
  WithdrawalDto,
  WithdrawalQueryDto,
} from './dto';

const MIN_COMMISSION_AMOUNT = 0.01; // Minimum 1 kopeck

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get partner dashboard statistics.
   */
  async getDashboard(userId: string): Promise<PartnerDashboardDto> {
    // Get current partner level
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Get all statistics in parallel
    const [
      directReferrals,
      teamSize,
      approvedCommissions,
      pendingCommissions,
      withdrawals,
      thisMonthCommissions,
      lastMonthCommissions,
      teamVolume,
    ] = await Promise.all([
      // Direct referrals (level 1)
      this.prisma.partnerRelationship.count({
        where: { partnerId: userId, level: 1 },
      }),
      // Total team size (all levels)
      this.prisma.partnerRelationship.count({
        where: { partnerId: userId },
      }),
      // Approved commissions
      this.prisma.partnerCommission.aggregate({
        where: { partnerId: userId, status: CommissionStatus.APPROVED },
        _sum: { amount: true },
      }),
      // Pending commissions
      this.prisma.partnerCommission.aggregate({
        where: { partnerId: userId, status: CommissionStatus.PENDING },
        _sum: { amount: true },
      }),
      // Completed withdrawals
      this.prisma.withdrawalRequest.aggregate({
        where: { userId, status: WithdrawalStatus.COMPLETED },
        _sum: { amount: true },
      }),
      // This month commissions
      this.getMonthCommissions(userId, 0),
      // Last month commissions
      this.getMonthCommissions(userId, -1),
      // Team volume
      this.getTeamVolume(userId),
    ]);

    // Get active referrals (those with transactions)
    const activeReferrals = await this.getActiveReferralsCount(userId);

    // Calculate totals
    const totalApproved = Number(approvedCommissions._sum.amount) || 0;
    const totalPending = Number(pendingCommissions._sum.amount) || 0;
    const totalWithdrawn = Number(withdrawals._sum.amount) || 0;

    // Determine current level based on referrals and team volume
    const currentLevel = this.calculateLevel(directReferrals, teamVolume);
    const levelInfo = PARTNER_LEVELS[currentLevel as keyof typeof PARTNER_LEVELS];

    // Calculate next level progress
    const nextLevelProgress = this.calculateNextLevelProgress(
      currentLevel,
      directReferrals,
      teamVolume,
    );

    return {
      currentLevel,
      levelName: levelInfo.name,
      referralCode: user.referralCode,
      referralUrl: user.username
        ? `/register?ref=${user.referralCode}&partner=${user.username}`
        : `/register?ref=${user.referralCode}`,
      totalReferrals: directReferrals,
      activeReferrals,
      teamSize,
      totalEarnings: totalApproved,
      pendingEarnings: totalPending,
      availableBalance: totalApproved - totalWithdrawn,
      thisMonthEarnings: thisMonthCommissions,
      lastMonthEarnings: lastMonthCommissions,
      nextLevelProgress,
    };
  }

  /**
   * Get referral tree structure.
   */
  async getReferralTree(userId: string, maxDepth: number = 1): Promise<ReferralTreeDto> {
    // Get direct referrals with their stats
    const directRelationships = await this.prisma.partnerRelationship.findMany({
      where: { partnerId: userId, level: 1 },
      include: {
        referral: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get transaction totals for each referral
    const referralIds = directRelationships.map(r => r.referralId);
    const transactionTotals = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where: {
        userId: { in: referralIds },
        status: TransactionStatus.COMPLETED,
      },
      _sum: { amount: true },
    });

    const totalsMap = new Map(
      transactionTotals.map(t => [t.userId, Number(t._sum.amount) || 0]),
    );

    // Build tree nodes
    const directReferrals: ReferralNodeDto[] = await Promise.all(
      directRelationships.map(async (rel) => {
        const totalSpent = totalsMap.get(rel.referralId) || 0;
        let children: ReferralNodeDto[] = [];

        // If depth > 1, fetch children recursively
        if (maxDepth > 1) {
          children = await this.getChildReferrals(rel.referralId, 2, maxDepth);
        }

        return {
          userId: rel.referral.id,
          firstName: rel.referral.firstName || 'Unknown',
          lastName: rel.referral.lastName || undefined,
          email: rel.referral.email,
          level: 1,
          joinedAt: rel.referral.createdAt,
          totalSpent,
          isActive: totalSpent > 0,
          children,
        };
      }),
    );

    // Get total team size
    const totalTeamSize = await this.prisma.partnerRelationship.count({
      where: { partnerId: userId },
    });

    return {
      directReferrals,
      directCount: directReferrals.length,
      totalTeamSize,
    };
  }

  /**
   * Get commission history.
   */
  async getCommissions(
    userId: string,
    query: CommissionQueryDto,
  ): Promise<{ items: CommissionDto[]; total: number; page: number; limit: number }> {
    const { status, level, fromDate, toDate, page = 1, limit = 20 } = query;

    const where: Prisma.PartnerCommissionWhereInput = { partnerId: userId };

    if (status) where.status = status;
    if (level) where.level = level;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [total, commissions] = await Promise.all([
      this.prisma.partnerCommission.count({ where }),
      this.prisma.partnerCommission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Fetch source users separately
    const sourceUserIds = [...new Set(commissions.map(c => c.sourceUserId))];
    const sourceUsers = await this.prisma.user.findMany({
      where: { id: { in: sourceUserIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const userMap = new Map(sourceUsers.map(u => [u.id, u]));

    return {
      items: commissions.map(c => {
        const user = userMap.get(c.sourceUserId);
        return {
          id: c.id,
          sourceUser: {
            id: c.sourceUserId,
            firstName: user?.firstName || 'Unknown',
            lastName: user?.lastName || undefined,
          },
          level: c.level,
          amount: Number(c.amount),
          status: c.status,
          createdAt: c.createdAt,
          paidAt: c.paidAt || undefined,
        };
      }),
      total,
      page,
      limit,
    };
  }

  /**
   * Get available balance for withdrawal.
   */
  async getAvailableBalance(userId: string): Promise<AvailableBalanceDto> {
    return this.prisma.$transaction(async (tx) => {
      const [approvedCommissions, pendingWithdrawals, completedWithdrawals] = await Promise.all([
        tx.partnerCommission.aggregate({
          where: { partnerId: userId, status: CommissionStatus.APPROVED },
          _sum: { amount: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: {
            userId,
            status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED, WithdrawalStatus.PROCESSING] },
          },
          _sum: { amount: true },
        }),
        tx.withdrawalRequest.aggregate({
          where: { userId, status: WithdrawalStatus.COMPLETED },
          _sum: { amount: true },
        }),
      ]);

      const totalEarnings = Number(approvedCommissions._sum.amount) || 0;
      const pendingAmount = Number(pendingWithdrawals._sum.amount) || 0;
      const withdrawnAmount = Number(completedWithdrawals._sum.amount) || 0;

      return {
        totalEarnings,
        pendingWithdrawals: pendingAmount,
        withdrawnAmount,
        availableBalance: totalEarnings - pendingAmount - withdrawnAmount,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });
  }

  /**
   * Create withdrawal request.
   */
  async createWithdrawal(userId: string, dto: CreateWithdrawalDto): Promise<WithdrawalDto> {
    // Check user status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, emailVerified: true },
    });

    if (!user?.isActive) {
      throw new BadRequestException('Аккаунт деактивирован');
    }
    if (!user?.emailVerified) {
      throw new BadRequestException('Необходимо подтвердить email для вывода средств');
    }

    // Check available balance
    const balance = await this.getAvailableBalance(userId);

    if (dto.amount > balance.availableBalance) {
      throw new BadRequestException('Недостаточно средств для вывода');
    }

    // Calculate tax
    const taxCalc = this.calculateTax(dto.amount, dto.taxStatus);

    // Create withdrawal request
    const withdrawal = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: dto.amount,
        currency: 'RUB',
        paymentDetails: dto.paymentDetails as any,
        taxStatus: dto.taxStatus,
        taxAmount: taxCalc.taxAmount,
        status: WithdrawalStatus.PENDING,
      },
    });

    return {
      id: withdrawal.id,
      amount: Number(withdrawal.amount),
      taxStatus: withdrawal.taxStatus,
      taxAmount: Number(withdrawal.taxAmount),
      netAmount: taxCalc.netAmount,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
      processedAt: withdrawal.processedAt || undefined,
      rejectionReason: withdrawal.rejectionReason || undefined,
    };
  }

  async confirmReferralVerification(partnerId: string, targetUserId: string) {
    if (partnerId === targetUserId) {
      throw new BadRequestException('Self-verification is not allowed');
    }

    const relationship = await this.prisma.partnerRelationship.findFirst({
      where: {
        partnerId,
        referralId: targetUserId,
        level: 1,
      },
    });

    if (!relationship) {
      throw new BadRequestException('Only direct referred users can be verified by this partner');
    }

    const circularRelationship = await this.prisma.partnerRelationship.findFirst({
      where: {
        partnerId: targetUserId,
        referralId: partnerId,
      },
    });

    if (circularRelationship) {
      throw new BadRequestException('Circular partner verification is not allowed');
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          verificationStatus: true,
        },
      });

      if (!target) {
        throw new NotFoundException('User not found');
      }

      if (target.verificationStatus === VerificationStatus.VERIFIED) {
        throw new BadRequestException('User is already verified');
      }

      const now = new Date();
      const existing = await tx.userVerification.findFirst({
        where: {
          userId: targetUserId,
          method: VerificationMethod.THIRD_PARTY,
          status: VerificationStatus.PENDING,
        },
        orderBy: { createdAt: 'desc' },
      });

      const verification = existing
        ? await tx.userVerification.update({
            where: { id: existing.id },
            data: {
              status: VerificationStatus.PENDING,
              confirmedByPartnerId: partnerId,
              confirmedAt: now,
              partnerRelationshipId: relationship.id,
            },
          })
        : await tx.userVerification.create({
            data: {
              userId: targetUserId,
              method: VerificationMethod.THIRD_PARTY,
              status: VerificationStatus.PENDING,
              confirmedByPartnerId: partnerId,
              confirmedAt: now,
              partnerRelationshipId: relationship.id,
            },
          });

      await tx.user.update({
        where: { id: targetUserId },
        data: {
          verificationStatus: VerificationStatus.PENDING,
          verificationMethod: VerificationMethod.THIRD_PARTY,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: partnerId,
          action: 'VERIFICATION_PARTNER_CONFIRMED',
          entityType: 'UserVerification',
          entityId: verification.id,
          oldValue: { status: target.verificationStatus },
          newValue: {
            targetUserId,
            status: VerificationStatus.PENDING,
            partnerConfirmed: true,
            method: VerificationMethod.THIRD_PARTY,
            partnerRelationshipId: relationship.id,
          },
        },
      });

      return {
        success: true,
        verificationId: verification.id,
        status: VerificationStatus.PENDING,
        method: VerificationMethod.THIRD_PARTY,
        confirmedAt: now,
        nextStep: 'PENDING_ADMIN_REVIEW',
      };
    });
  }

  async getVerificationRequests(partnerId: string) {
    const requests = await this.prisma.userVerification.findMany({
      where: {
        method: VerificationMethod.THIRD_PARTY,
        status: VerificationStatus.PENDING,
        OR: [
          { confirmedByPartnerId: partnerId },
          {
            partnerRelationship: {
              partnerId,
              level: 1,
            },
          },
          {
            user: {
              referredById: partnerId,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
            ageCategory: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        partnerRelationship: true,
      },
      orderBy: [
        { confirmedAt: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      items: requests.map((request) => ({
        id: request.id,
        userId: request.userId,
        user: request.user,
        status: request.status,
        createdAt: request.createdAt,
        confirmedAt: request.confirmedAt,
        partnerRelationshipId: request.partnerRelationshipId,
        canConfirm:
          !request.confirmedAt &&
          request.userId !== partnerId &&
          request.partnerRelationship?.partnerId === partnerId,
      })),
      total: requests.length,
    };
  }

  async confirmVerificationRequest(partnerId: string, verificationId: string) {
    const request = await this.prisma.userVerification.findFirst({
      where: {
        id: verificationId,
        method: VerificationMethod.THIRD_PARTY,
        status: VerificationStatus.PENDING,
      },
      include: { partnerRelationship: true, user: true },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (!request.partnerRelationship || request.partnerRelationship.partnerId !== partnerId) {
      throw new BadRequestException('Only the direct partner can confirm this request');
    }

    const result = await this.confirmReferralVerification(partnerId, request.userId);

    await this.notificationsService.sendNotification({
      userId: request.userId,
      title: 'Партнер подтвердил заявку',
      body: 'Партнер подтвердил ваш аккаунт. Заявка ожидает финальной проверки модератором.',
      data: {
        type: 'VERIFICATION_PARTNER_CONFIRMED',
        verificationId,
        path: '/account/verification',
      },
    });

    await this.notifyModeratorsAfterPartnerConfirmation(verificationId, request.userId);

    return result;
  }

  async rejectVerificationRequest(partnerId: string, verificationId: string, reason?: string) {
    const request = await this.prisma.userVerification.findFirst({
      where: {
        id: verificationId,
        method: VerificationMethod.THIRD_PARTY,
        status: VerificationStatus.PENDING,
      },
      include: { partnerRelationship: true },
    });

    if (!request) {
      throw new NotFoundException('Verification request not found');
    }

    if (!request.partnerRelationship || request.partnerRelationship.partnerId !== partnerId) {
      throw new BadRequestException('Only the direct partner can reject this request');
    }

    const rejectionReason = reason?.trim() || 'Партнер не подтвердил связь с пользователем';

    const updated = await this.prisma.$transaction(async (tx) => {
      const verification = await tx.userVerification.update({
        where: { id: verificationId },
        data: {
          status: VerificationStatus.REJECTED,
          rejectionReason,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: request.userId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          verificationMethod: VerificationMethod.THIRD_PARTY,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: partnerId,
          action: 'VERIFICATION_PARTNER_REJECTED',
          entityType: 'UserVerification',
          entityId: verificationId,
          oldValue: { status: request.status },
          newValue: { status: VerificationStatus.REJECTED, reason: rejectionReason },
        },
      });

      return verification;
    });

    await this.notificationsService.sendNotification({
      userId: request.userId,
      title: 'Партнерская верификация отклонена',
      body: rejectionReason,
      data: {
        type: 'VERIFICATION_PARTNER_REJECTED',
        verificationId,
        path: '/account/verification',
      },
    });

    return { success: true, verificationId: updated.id, status: updated.status };
  }

  /**
   * Get withdrawal history.
   */
  async getWithdrawals(
    userId: string,
    query: WithdrawalQueryDto,
  ): Promise<{ items: WithdrawalDto[]; total: number; page: number; limit: number }> {
    const { status, fromDate, toDate, page = 1, limit = 20 } = query;

    const where: Prisma.WithdrawalRequestWhereInput = { userId };

    if (status) where.status = status;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [total, items] = await Promise.all([
      this.prisma.withdrawalRequest.count({ where }),
      this.prisma.withdrawalRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: items.map(w => ({
        id: w.id,
        amount: Number(w.amount),
        taxStatus: w.taxStatus,
        taxAmount: Number(w.taxAmount),
        netAmount: Number(w.amount) - Number(w.taxAmount),
        status: w.status,
        createdAt: w.createdAt,
        processedAt: w.processedAt || undefined,
        rejectionReason: w.rejectionReason || undefined,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Calculate tax based on tax status.
   */
  calculateTax(amount: number, taxStatus: TaxStatus): TaxCalculationDto {
    let rate: number;

    switch (taxStatus) {
      case TaxStatus.INDIVIDUAL:
        rate = TAX_RATES.INDIVIDUAL;
        break;
      case TaxStatus.SELF_EMPLOYED:
        rate = TAX_RATES.SELF_EMPLOYED;
        break;
      case TaxStatus.ENTREPRENEUR:
        rate = TAX_RATES.ENTREPRENEUR;
        break;
      case TaxStatus.COMPANY:
        rate = 0; // Company handles own taxes
        break;
      default:
        rate = TAX_RATES.INDIVIDUAL;
    }

    const taxAmount = Math.round(amount * rate * 100) / 100;
    const netAmount = amount - taxAmount;

    return {
      grossAmount: amount,
      taxRate: rate,
      taxAmount,
      netAmount,
    };
  }

  /**
   * Get all partner levels configuration.
   */
  getPartnerLevels(): PartnerLevelDto[] {
    return Object.entries(PARTNER_LEVELS).map(([level, config]) => ({
      id: `level-${level}`,
      levelNumber: parseInt(level),
      name: config.name,
      commissionRate: config.commissionRate,
      minReferrals: config.minReferrals,
      minTeamVolume: config.minTeamVolume,
      benefits: this.getLevelBenefits(parseInt(level)),
    }));
  }

  /**
   * Calculate and create commissions for a transaction.
   * Called by PaymentsService when a payment is completed.
   */
  async calculateAndCreateCommissions(
    transactionId: string,
    purchaserUserId: string,
    amount: Decimal,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    // Email verification gate: only create commissions for verified purchasers
    const purchaser = await client.user.findUnique({
      where: { id: purchaserUserId },
      select: { emailVerified: true },
    });

    if (!purchaser?.emailVerified) {
      this.logger.log(`Skipping commissions for unverified user ${purchaserUserId}`);
      return;
    }

    // Get all partners (upline) for this user, up to 5 levels
    const partnerRelationships = await client.partnerRelationship.findMany({
      where: { referralId: purchaserUserId },
      orderBy: { level: 'asc' },
      take: 5,
    });

    if (partnerRelationships.length === 0) return;

    // Calculate commissions for each level
    const commissionsToCreate = partnerRelationships
      .map((rel) => {
        const rate = COMMISSION_RATES_BY_DEPTH[rel.level as keyof typeof COMMISSION_RATES_BY_DEPTH] || 0;
        const commissionAmount = amount.mul(rate);

        if (commissionAmount.lt(MIN_COMMISSION_AMOUNT)) return null;

        return {
          partnerId: rel.partnerId,
          sourceUserId: purchaserUserId,
          sourceTransactionId: transactionId,
          level: rel.level,
          amount: commissionAmount,
          status: CommissionStatus.PENDING,
        };
      })
      .filter(Boolean) as Prisma.PartnerCommissionCreateManyInput[];

    if (commissionsToCreate.length === 0) return;

    const create = async (prismaClient: Prisma.TransactionClient) => {
      await prismaClient.partnerCommission.createMany({
        data: commissionsToCreate,
        skipDuplicates: true,
      });

      await prismaClient.auditLog.create({
        data: {
          action: 'COMMISSIONS_CREATED',
          entityType: 'Transaction',
          entityId: transactionId,
          newValue: {
            transactionId,
            purchaserUserId,
            amount: amount.toString(),
            commissionsCount: commissionsToCreate.length,
          },
        },
      });
    };

    if (tx) {
      await create(tx);
      return;
    }

    await this.prisma.$transaction(create);
  }

  /**
   * Clawback commissions when a transaction is refunded.
   * PENDING commissions are auto-cancelled.
   * APPROVED/PAID commissions are flagged for admin review.
   */
  async clawbackCommissions(transactionId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Auto-cancel PENDING commissions
      const cancelResult = await tx.partnerCommission.updateMany({
        where: { sourceTransactionId: transactionId, status: CommissionStatus.PENDING },
        data: { status: CommissionStatus.CANCELLED },
      });

      // Flag APPROVED/PAID commissions for admin review
      const approvedOrPaid = await tx.partnerCommission.findMany({
        where: {
          sourceTransactionId: transactionId,
          status: { in: [CommissionStatus.APPROVED, CommissionStatus.PAID] },
        },
        select: { id: true, amount: true, partnerId: true, level: true },
      });

      await tx.auditLog.create({
        data: {
          action: 'COMMISSION_CLAWBACK',
          entityType: 'Transaction',
          entityId: transactionId,
          newValue: {
            cancelledCount: cancelResult.count,
            flaggedForReview: approvedOrPaid.map(c => ({
              id: c.id,
              amount: c.amount.toString(),
              partnerId: c.partnerId,
              level: c.level,
            })),
            reason: 'Transaction refunded',
          },
        },
      });

      if (approvedOrPaid.length > 0) {
        this.logger.warn(
          `${approvedOrPaid.length} APPROVED/PAID commissions for transaction ${transactionId} require admin review`,
        );
      }
    });
  }

  /**
   * Approve pending commissions (admin only).
   */
  async approveCommissions(commissionIds: string[]): Promise<number> {
    const result = await this.prisma.partnerCommission.updateMany({
      where: {
        id: { in: commissionIds },
        status: CommissionStatus.PENDING,
      },
      data: { status: CommissionStatus.APPROVED },
    });
    return result.count;
  }

  /**
   * Reject pending commissions (admin only).
   */
  async rejectCommissions(commissionIds: string[], reason: string): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.partnerCommission.updateMany({
        where: {
          id: { in: commissionIds },
          status: CommissionStatus.PENDING,
        },
        data: { status: CommissionStatus.CANCELLED },
      });

      await tx.auditLog.create({
        data: {
          action: 'COMMISSIONS_REJECTED',
          entityType: 'PartnerCommission',
          entityId: commissionIds.join(','),
          newValue: { reason, count: updateResult.count },
        },
      });

      return updateResult;
    });

    return result.count;
  }

  // ============ Private Helper Methods ============

  private async getMonthCommissions(userId: string, monthOffset: number): Promise<number> {
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1);

    const result = await this.prisma.partnerCommission.aggregate({
      where: {
        partnerId: userId,
        status: { in: [CommissionStatus.APPROVED, CommissionStatus.PAID] },
        createdAt: {
          gte: targetMonth,
          lt: nextMonth,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  private async getTeamVolume(userId: string): Promise<number> {
    // Get all referrals for this partner
    const referralIds = await this.prisma.partnerRelationship.findMany({
      where: { partnerId: userId },
      select: { referralId: true },
    });

    const ids = referralIds.map(r => r.referralId);

    if (ids.length === 0) return 0;

    // Sum all completed transactions from these users
    const result = await this.prisma.transaction.aggregate({
      where: {
        userId: { in: ids },
        status: TransactionStatus.COMPLETED,
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  private async getActiveReferralsCount(userId: string): Promise<number> {
    // Get direct referrals
    const directReferrals = await this.prisma.partnerRelationship.findMany({
      where: { partnerId: userId, level: 1 },
      select: { referralId: true },
    });

    const referralIds = directReferrals.map(r => r.referralId);

    if (referralIds.length === 0) return 0;

    // Count those with transactions
    const activeCount = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where: {
        userId: { in: referralIds },
        status: TransactionStatus.COMPLETED,
      },
    });

    return activeCount.length;
  }

  private calculateLevel(referralsCount: number, teamVolume: number): number {
    // Check from highest level to lowest
    for (let level = 5; level >= 1; level--) {
      const config = PARTNER_LEVELS[level as keyof typeof PARTNER_LEVELS];
      if (referralsCount >= config.minReferrals && teamVolume >= config.minTeamVolume) {
        return level;
      }
    }
    return 1;
  }

  private calculateNextLevelProgress(
    currentLevel: number,
    referralsCount: number,
    teamVolume: number,
  ): PartnerDashboardDto['nextLevelProgress'] {
    if (currentLevel >= 5) {
      // Already at max level
      const maxConfig = PARTNER_LEVELS[5];
      return {
        nextLevel: 5,
        nextLevelName: maxConfig.name,
        referralsNeeded: maxConfig.minReferrals,
        currentReferrals: referralsCount,
        teamVolumeNeeded: maxConfig.minTeamVolume,
        currentTeamVolume: teamVolume,
        progressPercent: 100,
      };
    }

    const nextLevel = currentLevel + 1;
    const nextConfig = PARTNER_LEVELS[nextLevel as keyof typeof PARTNER_LEVELS];

    // Calculate progress (average of referrals and volume progress)
    const referralProgress = Math.min(100, (referralsCount / nextConfig.minReferrals) * 100);
    const volumeProgress = nextConfig.minTeamVolume > 0
      ? Math.min(100, (teamVolume / nextConfig.minTeamVolume) * 100)
      : 100;
    const progressPercent = Math.round((referralProgress + volumeProgress) / 2);

    return {
      nextLevel,
      nextLevelName: nextConfig.name,
      referralsNeeded: nextConfig.minReferrals,
      currentReferrals: referralsCount,
      teamVolumeNeeded: nextConfig.minTeamVolume,
      currentTeamVolume: teamVolume,
      progressPercent,
    };
  }

  private async notifyModeratorsAfterPartnerConfirmation(
    verificationId: string,
    targetUserId: string,
  ) {
    const moderators = await this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MODERATOR'] } },
      select: { id: true },
    });

    await Promise.all(
      moderators.map((moderator) =>
        this.notificationsService.sendNotification({
          userId: moderator.id,
          title: 'Партнер подтвердил заявку',
          body: 'Заявка ожидает финального решения администратора или модератора.',
          data: {
            type: 'VERIFICATION_PARTNER_CONFIRMED_ADMIN_REVIEW',
            verificationId,
            targetUserId,
            path: '/admin/verifications',
          },
        }),
      ),
    );
  }

  private async getChildReferrals(
    userId: string,
    currentLevel: number,
    maxDepth: number,
  ): Promise<ReferralNodeDto[]> {
    if (currentLevel > maxDepth) return [];

    const relationships = await this.prisma.partnerRelationship.findMany({
      where: { partnerId: userId, level: 1 },
      include: {
        referral: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return Promise.all(
      relationships.map(async (rel) => {
        const transactionSum = await this.prisma.transaction.aggregate({
          where: { userId: rel.referralId, status: TransactionStatus.COMPLETED },
          _sum: { amount: true },
        });

        const totalSpent = Number(transactionSum._sum.amount) || 0;
        const children = await this.getChildReferrals(rel.referralId, currentLevel + 1, maxDepth);

        return {
          userId: rel.referral.id,
          firstName: rel.referral.firstName || 'Unknown',
          lastName: rel.referral.lastName || undefined,
          email: rel.referral.email,
          level: currentLevel,
          joinedAt: rel.referral.createdAt,
          totalSpent,
          isActive: totalSpent > 0,
          children,
        };
      }),
    );
  }

  private getLevelBenefits(level: number): string[] {
    const benefits: string[] = ['Базовые комиссии'];

    if (level >= 2) benefits.push('Повышенная ставка комиссии');
    if (level >= 3) benefits.push('Приоритетная поддержка');
    if (level >= 4) benefits.push('Эксклюзивные материалы');
    if (level >= 5) benefits.push('VIP статус', 'Персональный менеджер');

    return benefits;
  }
}
