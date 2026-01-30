import { registerAs } from '@nestjs/config';

const requireEnvInProd = (key: string, fallback: string): string => {
  const value = process.env[key];
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`${key} environment variable is required in production`);
  }
  return value || fallback;
};

export default registerAs('database', () => ({
  host: requireEnvInProd('DATABASE_HOST', 'localhost'),
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: requireEnvInProd('DATABASE_NAME', 'icheck'),
  username: requireEnvInProd('DATABASE_USERNAME', 'postgres'),
  password: requireEnvInProd('DATABASE_PASSWORD', 'postgres'),
}));
