import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationStatus, VerificationMethod } from '@prisma/client';

export class AdminVerificationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId!: string;

  @ApiProperty({ example: 'user@example.com' })
  userEmail!: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  userAvatarUrl?: string | null;

  @ApiProperty({ example: 'Иван' })
  userFirstName!: string;

  @ApiProperty({ example: 'Иванов' })
  userLastName!: string;

  @ApiProperty({ example: 'CLIENT' })
  userRole!: string;

  @ApiProperty({ example: '18+' })
  userAgeCategory!: string;

  @ApiPropertyOptional({ example: '1990-01-15T00:00:00Z' })
  userDateOfBirth?: Date | null;

  @ApiProperty({ example: '2024-01-01T10:00:00Z' })
  userCreatedAt!: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00Z' })
  userUpdatedAt!: Date;

  @ApiProperty({ example: 'PENDING' })
  userVerificationStatus!: string;

  @ApiProperty({ enum: VerificationMethod, example: VerificationMethod.DOCUMENT })
  method!: VerificationMethod;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/documents/passport.jpg' })
  documentUrl?: string | null;

  @ApiPropertyOptional({ example: 'user-id/document.pdf' })
  documentKey?: string | null;

  @ApiProperty({ enum: VerificationStatus, example: VerificationStatus.PENDING })
  status!: VerificationStatus;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  reviewedByEmail?: string | null;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  reviewedAt?: Date | null;

  @ApiPropertyOptional({ example: 'Документ нечитаемый' })
  rejectionReason?: string | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440002' })
  confirmedByPartnerId?: string | null;

  @ApiPropertyOptional({ example: 'partner@example.com' })
  confirmedByPartnerEmail?: string | null;

  @ApiPropertyOptional({ example: '2024-01-12T10:30:00Z' })
  confirmedAt?: Date | null;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440003' })
  partnerRelationshipId?: string | null;

  @ApiPropertyOptional({ example: { id: 'transaction-id', amount: 10, currency: 'RUB' } })
  payment?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 3 })
  auditEventsCount?: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  verifiedAt?: Date | null;

  @ApiProperty({ example: '2024-01-10T08:00:00Z' })
  createdAt!: Date;
}

export class AdminVerificationQueryDto {
  @ApiPropertyOptional({ enum: VerificationStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;

  @ApiPropertyOptional({ enum: VerificationMethod, description: 'Filter by method' })
  @IsOptional()
  @IsEnum(VerificationMethod)
  method?: VerificationMethod;

  @ApiPropertyOptional({ description: 'Search by user email or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminVerificationListDto {
  @ApiProperty({ type: [AdminVerificationDto] })
  items!: AdminVerificationDto[];

  @ApiProperty({ example: 150 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;
}

export class AdminVerificationStatsDto {
  @ApiProperty({ example: 15, description: 'Number of pending verifications' })
  pending!: number;

  @ApiProperty({ example: 120, description: 'Number of approved verifications' })
  approved!: number;

  @ApiProperty({ example: 25, description: 'Number of rejected verifications' })
  rejected!: number;

  @ApiProperty({ example: 160, description: 'Total verifications' })
  total!: number;

  @ApiProperty({ example: 12, description: 'Verifications waiting more than 24 hours' })
  overdueCount!: number;
}

export class RejectVerificationDto {
  @ApiProperty({
    example: 'Документ нечитаемый. Пожалуйста, загрузите фотографию более высокого качества.',
    description: 'Reason for rejection (will be shown to user)',
  })
  @IsString()
  reason!: string;
}

export class VerificationActionResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Verification approved successfully' })
  message!: string;

  @ApiProperty({ type: AdminVerificationDto })
  verification!: AdminVerificationDto;
}
