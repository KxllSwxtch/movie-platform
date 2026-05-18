import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { PaymentMethodType } from '@prisma/client';
import { VerificationMethod } from '@movie-platform/shared';

export class VerificationSubmissionDto {
  @ApiProperty({
    enum: VerificationMethod,
    description: 'Verification method to use',
    example: VerificationMethod.PAYMENT,
  })
  @IsEnum(VerificationMethod, {
    message: 'Метод должен быть одним из: PAYMENT, DOCUMENT, THIRD_PARTY',
  })
  method!: VerificationMethod;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/documents/passport.jpg',
    description: 'Deprecated. Document uploads must use documentKey from the private upload endpoint.',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Укажите корректный URL документа' })
  documentUrl?: string;

  @ApiPropertyOptional({
    example: 'user-id/550e8400-e29b-41d4-a716-446655440000.pdf',
    description: 'Private storage key returned by the verification document upload endpoint',
  })
  @IsOptional()
  @IsString()
  documentKey?: string;

  @ApiPropertyOptional({
    enum: PaymentMethodType,
    example: PaymentMethodType.CARD,
    description: 'Payment method for PAYMENT verification',
  })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  paymentMethod?: PaymentMethodType;

  @ApiPropertyOptional({ description: 'Return URL after payment completion' })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  returnUrl?: string;
}
