import { registerAs } from '@nestjs/config';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  return secret || 'icheck-dev-secret-do-not-use-in-prod';
};

export default registerAs('jwt', () => ({
  secret: getJwtSecret(),
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
}));

