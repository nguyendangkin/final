import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

// Cookie configuration constants
const COOKIE_NAME = 'jwt_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(isProduction: boolean) {
    const baseOptions = {
      httpOnly: true, // Prevents JavaScript access - critical for security
      secure: isProduction, // HTTPS only in production
      sameSite: isProduction ? ('strict' as const) : ('lax' as const),
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    };

    // In production, set domain to allow cookie sharing between subdomains
    if (isProduction) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (frontendUrl) {
        try {
          const hostname = new URL(frontendUrl).hostname;
          // Extract root domain (e.g., "4gach.com" from "4gach.com" or "www.4gach.com")
          const parts = hostname.split('.');
          const rootDomain = parts.length >= 2
            ? `.${parts.slice(-2).join('.')}`
            : hostname;
          return { ...baseOptions, domain: rootDomain };
        } catch {
          // If URL parsing fails, skip domain setting
        }
      }
    }

    return baseOptions;
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const { access_token } = await this.authService.login(req.user);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Set HTTP-only cookie instead of passing token in URL
    res.cookie(COOKIE_NAME, access_token, this.getCookieOptions(isProduction));

    // Redirect to frontend without token in URL (much more secure)
    res.redirect(`${frontendUrl}/?login=success`);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    // Clear the JWT cookie
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ('strict' as const) : ('lax' as const),
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req) {
    return { user: req.user };
  }
}
