import { Controller, Get, Post, UseGuards, Req, Res, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard, JwtAuthGuard, CurrentUser } from '../common';
import { User } from '../users/entities/user.entity';

interface GoogleOAuthUser {
  email: string;
  displayName: string;
  googleId: string;
  avatar?: string;
}

interface GoogleOAuthRequest extends Request {
  user: GoogleOAuthUser;
}

interface RefreshTokenDto {
  refreshToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: GoogleOAuthRequest, @Res() res: Response) {
    // Guard may have already redirected (e.g., user cancelled login)
    if (res.headersSent) {
      return;
    }

    const user = await this.authService.validateGoogleUser(req.user);
    const tokens = await this.authService.generateTokens(user);

    // Redirect to frontend with both tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto, @Req() req: Request) {
    // Extract access token from Authorization header to get userId
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // Decode JWT to get userId (we allow expired tokens for refresh)
    try {
      const token = authHeader.split(' ')[1];
      // Simple base64 decode of payload (JWT format: header.payload.signature)
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      const userId = payload.sub;

      if (!userId || !body.refreshToken) {
        throw new UnauthorizedException('Invalid token');
      }

      const tokens = await this.authService.refreshAccessToken(
        userId,
        body.refreshToken,
      );
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User) {
    await this.authService.invalidateRefreshToken(user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('logout')
  legacyLogout(@Res() res: Response) {
    // Legacy endpoint for backward compatibility
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login`);
  }
}

