import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { access_token, user } = await this.authService.login(req.user);
    // Redirect to frontend with token
    // In production, better to use cookies or a secure way to pass the token
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}?token=${access_token}`,
    );
  }
}
