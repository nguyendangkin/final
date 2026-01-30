import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = User>(
    err: Error | null,
    user: TUser | false,
  ): TUser | null {
    // Return user if authenticated, otherwise return null (don't throw error)
    return user || null;
  }

  canActivate(context: ExecutionContext) {
    // Call the parent canActivate
    return super.canActivate(context);
  }

  // Override to not throw on missing/invalid token
  async validate(context: ExecutionContext) {
    try {
      const result = await super.canActivate(context);
      return result;
    } catch {
      return true; // Allow request even without valid token
    }
  }
}
