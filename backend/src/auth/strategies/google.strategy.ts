import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import type { ConfigType } from '@nestjs/config';
import googleConfig from '../../config/google.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleConfig>,
  ) {
    super({
      clientID: googleConfiguration.clientId || '',
      clientSecret: googleConfiguration.clientSecret || '',
      callbackURL: googleConfiguration.callbackUrl,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, emails, displayName, photos } = profile;
    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      displayName: displayName || '',
      avatar: photos?.[0]?.value,
    };
    done(null, user);
  }
}
