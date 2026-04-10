import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TaxStatus } from '@prisma/client';
import { UserRole } from '@movie-platform/shared';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { VerificationGuard } from '../auth/guards/verification.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { VerificationRequired } from '../../common/decorators/verification-required.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PartnersService } from './partners.service';
import {
  ApproveCommissionsDto,
  AvailableBalanceDto,
  CommissionActionResultDto,
  CommissionDto,
  CommissionQueryDto,
  CreateWithdrawalDto,
  PartnerDashboardDto,
  PartnerLevelDto,
  RejectCommissionsDto,
  ReferralTreeDto,
  TaxCalculationDto,
  WithdrawalDto,
  WithdrawalQueryDto,
} from './dto';

@ApiTags('Partners')
@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard, VerificationGuard)
@Roles(UserRole.PARTNER, UserRole.ADMIN, UserRole.MODERATOR)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  /**
   * Get partner dashboard with statistics.
   */
  @Get('dashboard')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get partner dashboard statistics' })
  @ApiOkResponse({ type: PartnerDashboardDto })
  async getDashboard(@CurrentUser('id') userId: string): Promise<PartnerDashboardDto> {
    return this.partnersService.getDashboard(userId);
  }

  /**
   * Get referral tree structure.
   */
  @Get('referrals')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral tree structure' })
  @ApiQuery({ name: 'depth', required: false, type: Number, description: 'Tree depth (1-5)' })
  @ApiOkResponse({ type: ReferralTreeDto })
  async getReferralTree(
    @CurrentUser('id') userId: string,
    @Query('depth') depth?: string,
  ): Promise<ReferralTreeDto> {
    const maxDepth = Math.min(Math.max(parseInt(depth || '1', 10) || 1, 1), 5);
    return this.partnersService.getReferralTree(userId, maxDepth);
  }

  /**
   * Get commission history.
   */
  @Get('commissions')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get commission history with pagination' })
  @ApiOkResponse({
    description: 'Paginated list of commissions',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/CommissionDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getCommissions(
    @CurrentUser('id') userId: string,
    @Query() query: CommissionQueryDto,
  ): Promise<{ items: CommissionDto[]; total: number; page: number; limit: number }> {
    return this.partnersService.getCommissions(userId, query);
  }

  /**
   * Get available balance for withdrawal.
   */
  @Get('balance')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available balance for withdrawal' })
  @ApiOkResponse({ type: AvailableBalanceDto })
  async getAvailableBalance(@CurrentUser('id') userId: string): Promise<AvailableBalanceDto> {
    return this.partnersService.getAvailableBalance(userId);
  }

  /**
   * Create withdrawal request.
   */
  @Post('withdrawals')
  @VerificationRequired()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create withdrawal request' })
  @ApiOkResponse({ type: WithdrawalDto })
  async createWithdrawal(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWithdrawalDto,
  ): Promise<WithdrawalDto> {
    return this.partnersService.createWithdrawal(userId, dto);
  }

  @Post('verify-referral/:userId')
  @VerificationRequired()
  @ApiBearerAuth()
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Confirm verification for a direct referred user' })
  async verifyReferral(
    @CurrentUser('id') partnerId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.partnersService.confirmReferralVerification(partnerId, targetUserId);
  }

  @Get('verification-requests')
  @VerificationRequired()
  @ApiBearerAuth()
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Get partner verification requests from direct referrals' })
  async getVerificationRequests(@CurrentUser('id') partnerId: string) {
    return this.partnersService.getVerificationRequests(partnerId);
  }

  @Post('verification-requests/:id/confirm')
  @VerificationRequired()
  @ApiBearerAuth()
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Confirm a partner verification request for admin review' })
  async confirmVerificationRequest(
    @CurrentUser('id') partnerId: string,
    @Param('id') verificationId: string,
  ) {
    return this.partnersService.confirmVerificationRequest(partnerId, verificationId);
  }

  @Post('verification-requests/:id/reject')
  @VerificationRequired()
  @ApiBearerAuth()
  @Roles(UserRole.PARTNER)
  @ApiOperation({ summary: 'Reject a partner verification request' })
  async rejectVerificationRequest(
    @CurrentUser('id') partnerId: string,
    @Param('id') verificationId: string,
    @Body('reason') reason?: string,
  ) {
    return this.partnersService.rejectVerificationRequest(partnerId, verificationId, reason);
  }

  /**
   * Get withdrawal history.
   */
  @Get('withdrawals')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get withdrawal history with pagination' })
  @ApiOkResponse({
    description: 'Paginated list of withdrawals',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/WithdrawalDto' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async getWithdrawals(
    @CurrentUser('id') userId: string,
    @Query() query: WithdrawalQueryDto,
  ): Promise<{ items: WithdrawalDto[]; total: number; page: number; limit: number }> {
    return this.partnersService.getWithdrawals(userId, query);
  }

  /**
   * Preview tax calculation for withdrawal.
   */
  @Get('tax-preview')
  @VerificationRequired()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview tax calculation for a withdrawal amount' })
  @ApiQuery({ name: 'amount', required: true, type: Number, description: 'Withdrawal amount' })
  @ApiQuery({ name: 'taxStatus', required: true, enum: TaxStatus, description: 'Tax status' })
  @ApiOkResponse({ type: TaxCalculationDto })
  async getTaxPreview(
    @Query('amount') amount: string,
    @Query('taxStatus') taxStatus: TaxStatus,
  ): Promise<TaxCalculationDto> {
    const amountNum = parseFloat(amount) || 0;
    return this.partnersService.calculateTax(amountNum, taxStatus);
  }

  /**
   * Get partner levels configuration (public).
   */
  @Get('levels')
  @Public()
  @Roles()
  @ApiOperation({ summary: 'Get partner levels configuration (public)' })
  @ApiOkResponse({ type: [PartnerLevelDto] })
  getPartnerLevels(): PartnerLevelDto[] {
    return this.partnersService.getPartnerLevels();
  }

  // ============ Admin Endpoints ============

  /**
   * Approve pending commissions (admin only).
   */
  @Patch('admin/commissions/approve')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve pending commissions (admin only)' })
  @ApiOkResponse({ type: CommissionActionResultDto })
  async approveCommissions(
    @Body() dto: ApproveCommissionsDto,
  ): Promise<CommissionActionResultDto> {
    const count = await this.partnersService.approveCommissions(dto.commissionIds);
    return { count };
  }

  /**
   * Reject pending commissions (admin only).
   */
  @Patch('admin/commissions/reject')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject pending commissions (admin only)' })
  @ApiOkResponse({ type: CommissionActionResultDto })
  async rejectCommissions(
    @Body() dto: RejectCommissionsDto,
  ): Promise<CommissionActionResultDto> {
    const count = await this.partnersService.rejectCommissions(
      dto.commissionIds,
      dto.reason || 'Отклонено администратором',
    );
    return { count };
  }
}
