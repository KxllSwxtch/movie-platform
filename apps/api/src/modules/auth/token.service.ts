import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

import { REDIS_CLIENT } from '../../config/redis.module';

export interface TokenData {
  userId: string;
  type: 'password_reset' | 'email_verification';
  createdAt: Date;
}

/**
 * Service for managing password reset and email verification tokens.
 *
 * Tokens are:
 * - Stored in Redis with TTL
 * - Single-use (invalidated after use)
 * - Cryptographically random
 *
 * Redis key patterns:
 * - Password reset: token:password_reset:{token}
 * - Email verification: token:email_verification:{token}
 */
@Injectable()
export class TokenService {
  private readonly TOKEN_PREFIX = 'token:';
  private readonly PASSWORD_RESET_TTL: number;
  private readonly EMAIL_VERIFICATION_TTL: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    // Parse token expirations from config
    this.PASSWORD_RESET_TTL = this.parseExpirationToSeconds(
      this.configService.get<string>('PASSWORD_RESET_EXPIRATION', '1h'),
    );
    this.EMAIL_VERIFICATION_TTL = this.parseExpirationToSeconds(
      this.configService.get<string>('EMAIL_VERIFICATION_EXPIRATION', '24h'),
    );
  }

  /**
   * Generate a password reset token for a user.
   *
   * @param userId - User ID
   * @returns The generated token
   */
  async generatePasswordResetToken(userId: string): Promise<string> {
    // Invalidate any existing password reset tokens for this user
    await this.invalidateUserTokens(userId, 'password_reset');

    const token = this.generateSecureToken();
    const tokenData: TokenData = {
      userId,
      type: 'password_reset',
      createdAt: new Date(),
    };

    await this.redis.setex(
      this.getKey('password_reset', token),
      this.PASSWORD_RESET_TTL,
      JSON.stringify(tokenData),
    );

    // Also store reverse lookup for invalidation
    await this.redis.setex(
      this.getUserTokenKey(userId, 'password_reset'),
      this.PASSWORD_RESET_TTL,
      token,
    );

    return token;
  }

  /**
   * Validate a password reset token.
   *
   * @param token - Token to validate
   * @returns User ID if valid
   * @throws BadRequestException if token is invalid or expired
   */
  async validatePasswordResetToken(token: string): Promise<string> {
    const data = await this.redis.get(this.getKey('password_reset', token));

    if (!data) {
      throw new BadRequestException('Недействительный или просроченный токен сброса пароля');
    }

    const tokenData = JSON.parse(data) as TokenData;
    return tokenData.userId;
  }

  /**
   * Generate an email verification token for a user.
   *
   * @param userId - User ID
   * @returns The generated token
   */
  async generateEmailVerificationToken(userId: string): Promise<string> {
    // Invalidate any existing email verification tokens for this user
    await this.invalidateUserTokens(userId, 'email_verification');

    const token = this.generateSecureToken();
    const tokenData: TokenData = {
      userId,
      type: 'email_verification',
      createdAt: new Date(),
    };

    await this.redis.setex(
      this.getKey('email_verification', token),
      this.EMAIL_VERIFICATION_TTL,
      JSON.stringify(tokenData),
    );

    // Also store reverse lookup for invalidation
    await this.redis.setex(
      this.getUserTokenKey(userId, 'email_verification'),
      this.EMAIL_VERIFICATION_TTL,
      token,
    );

    return token;
  }

  /**
   * Validate an email verification token.
   *
   * @param token - Token to validate
   * @returns User ID if valid
   * @throws BadRequestException if token is invalid or expired
   */
  async validateEmailVerificationToken(token: string): Promise<string> {
    const data = await this.redis.get(this.getKey('email_verification', token));

    if (!data) {
      throw new BadRequestException('Недействительный или просроченный токен подтверждения email');
    }

    const tokenData = JSON.parse(data) as TokenData;
    return tokenData.userId;
  }

  /**
   * Invalidate a token (mark as used).
   *
   * @param token - Token to invalidate
   * @param type - Token type
   */
  async invalidateToken(
    token: string,
    type: 'password_reset' | 'email_verification',
  ): Promise<void> {
    const key = this.getKey(type, token);
    const data = await this.redis.get(key);

    if (data) {
      const tokenData = JSON.parse(data) as TokenData;
      // Remove both the token and the user reverse lookup
      await this.redis.del(key);
      await this.redis.del(this.getUserTokenKey(tokenData.userId, type));
    }
  }

  /**
   * Invalidate all tokens of a specific type for a user.
   *
   * @param userId - User ID
   * @param type - Token type
   */
  private async invalidateUserTokens(
    userId: string,
    type: 'password_reset' | 'email_verification',
  ): Promise<void> {
    const existingToken = await this.redis.get(this.getUserTokenKey(userId, type));
    if (existingToken) {
      await this.redis.del(this.getKey(type, existingToken));
      await this.redis.del(this.getUserTokenKey(userId, type));
    }
  }

  /**
   * Generate a cryptographically secure random token.
   *
   * @returns A 32-byte hex-encoded token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get Redis key for a token.
   */
  private getKey(type: string, token: string): string {
    return `${this.TOKEN_PREFIX}${type}:${token}`;
  }

  /**
   * Get Redis key for user's token (reverse lookup).
   */
  private getUserTokenKey(userId: string, type: string): string {
    return `${this.TOKEN_PREFIX}user:${userId}:${type}`;
  }

  /**
   * Parse expiration string to seconds.
   *
   * @param expiration - Expiration string (e.g., '1h', '24h', '7d')
   * @returns Expiration in seconds
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 60 * 60; // Default 1 hour
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 60 * 60;
    }
  }
}
