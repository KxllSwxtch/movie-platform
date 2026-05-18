import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, VerificationStatus } from '@movie-platform/shared';

import { VERIFICATION_REQUIRED_KEY } from '../../../common/decorators/verification-required.decorator';

@Injectable()
export class VerificationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isRequired = this.reflector.getAllAndOverride<boolean>(
      VERIFICATION_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!isRequired) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('Verification requires authentication');
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      return true;
    }

    if (user.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Account verification is required for this action',
      );
    }

    return true;
  }
}
