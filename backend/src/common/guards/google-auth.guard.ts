import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
    /**
     * Check for OAuth errors (e.g., user cancelled login) before proceeding.
     * Redirects to login page cleanly instead of showing raw 401.
     */
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        // Check if Google returned an error (user cancelled, access denied, etc.)
        const error = request.query.error as string | undefined;

        if (error) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            response.redirect(`${frontendUrl}/login`);
            return false;
        }

        // Let Passport handle the normal auth flow
        return super.canActivate(context);
    }
}





