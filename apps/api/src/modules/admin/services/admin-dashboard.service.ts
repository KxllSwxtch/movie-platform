import { Injectable } from '@nestjs/common';
import {
  OrderStatus,
  SubscriptionStatus,
  TransactionStatus,
  VerificationStatus,
  WithdrawalStatus,
} from '@prisma/client';

import { PrismaService } from '../../../config/prisma.service';
import {
  DashboardOverviewDto,
  DashboardStatsDto,
  RecentTransactionDto,
  RevenueStatDto,
  UserGrowthStatDto,
} from '../dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard overview with all stats.
   */
  async getDashboardOverview(): Promise<DashboardOverviewDto> {
    const [stats, revenueByMonth, userGrowth, recentTransactions] = await Promise.all([
      this.getDashboardStats(),
      this.getRevenueByMonth(6),
      this.getUserGrowth(30),
      this.getRecentTransactions(10),
    ]);

    return {
      stats,
      revenueByMonth,
      userGrowth,
      recentTransactions,
    };
  }

  /**
   * Get dashboard stats.
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      activeSubscriptions,
      monthlyRevenue,
      pendingOrders,
      pendingVerifications,
      pendingWithdrawals,
      contentCount,
      productCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.userSubscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.getMonthRevenue(),
      this.prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
      this.prisma.userVerification.count({
        where: { status: VerificationStatus.PENDING },
      }),
      this.prisma.withdrawalRequest.count({
        where: { status: WithdrawalStatus.PENDING },
      }),
      this.prisma.content.count(),
      this.prisma.product.count(),
    ]);

    return {
      totalUsers,
      newUsersToday,
      activeSubscriptions,
      monthlyRevenue,
      pendingOrders,
      pendingVerifications,
      pendingWithdrawals,
      contentCount,
      productCount,
    };
  }

  /**
   * Get revenue by month.
   */
  async getRevenueByMonth(months: number): Promise<RevenueStatDto[]> {
    const results: RevenueStatDto[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [subscriptionRevenue, storeRevenue] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            type: 'SUBSCRIPTION',
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            type: 'STORE',
            status: TransactionStatus.COMPLETED,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      const subRev = Number(subscriptionRevenue._sum.amount) || 0;
      const storeRev = Number(storeRevenue._sum.amount) || 0;

      results.push({
        period: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
        subscriptionRevenue: subRev,
        storeRevenue: storeRev,
        totalRevenue: subRev + storeRev,
      });
    }

    return results;
  }

  /**
   * Get user growth over time.
   */
  async getUserGrowth(days: number): Promise<UserGrowthStatDto[]> {
    const results: UserGrowthStatDto[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [newUsers, totalUsers] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: { gte: date, lt: nextDate },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: { lt: nextDate },
          },
        }),
      ]);

      results.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        totalUsers,
      });
    }

    return results;
  }

  /**
   * Get recent transactions.
   */
  async getRecentTransactions(limit: number): Promise<RecentTransactionDto[]> {
    const transactions = await this.prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      userEmail: t.user.email,
      type: t.type,
      amount: Number(t.amount),
      status: t.status,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Get current month's revenue.
   */
  private async getMonthRevenue(): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await this.prisma.transaction.aggregate({
      where: {
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }
}
