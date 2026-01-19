import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateGoogleUser(details: any) {
        const user = await this.usersService.findByEmail(details.email);
        if (user) {
            // Always update avatar and googleId to ensure they are current
            user.googleId = details.googleId;
            user.avatar = details.picture;

            // Update name if missing or potentially outdated (optional preference, here we prioritized keeping existing name if set, 
            // but for avatar user specifically asked for "real avatar", so let's sync it. 
            // If we want to force sync name too: user.name = ...
            // Lets stick to updating avatar as primary goal, and name if missing.
            if (!user.name) {
                user.name = `${details.firstName} ${details.lastName}`;
            }

            // Save the updated user info
            await this.usersService.create(user);
            return user;
        }
        const newUser = await this.usersService.create({
            email: details.email,
            name: `${details.firstName} ${details.lastName}`,
            googleId: details.googleId,
            avatar: details.picture,
        });
        return newUser;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: user,
        };
    }
}
