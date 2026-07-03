import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, IsOptional } from 'class-validator';

export class ApproveCommissionsDto {
  @ApiProperty({
    description: 'Array of commission IDs to approve',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Необходимо указать хотя бы одну комиссию' })
  commissionIds!: string[];
}

export class RejectCommissionsDto {
  @ApiProperty({
    description: 'Array of commission IDs to reject',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Необходимо указать хотя бы одну комиссию' })
  commissionIds!: string[];

  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Подозрение на мошенничество',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CommissionActionResultDto {
  @ApiProperty({ example: 3, description: 'Number of commissions affected' })
  count!: number;
}
