import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatar?: string;
}

interface TokenPayload {
  sub: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) { }

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    return this.usersService.findOrCreateFromGoogle(profile);
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(
      payload as Record<string, unknown>,
      {
        secret: this.jwtConfiguration.secret,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expiresIn: this.jwtConfiguration.accessTokenExpiresIn as any,
      },
    );

    // Generate a random refresh token
    const refreshToken = randomBytes(32).toString('hex');

    // Hash the refresh token before storing
    const hashedRefreshToken = this.hashToken(refreshToken);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshAccessToken(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify the refresh token matches
    const hashedRefreshToken = this.hashToken(refreshToken);
    if (hashedRefreshToken !== user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens (token rotation)
    return this.generateTokens(user);
  }

  /**
   * Invalidate all tokens for a user (logout)
   */
  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async getProfile(userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  /**
   * Hash a token using SHA-256
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

