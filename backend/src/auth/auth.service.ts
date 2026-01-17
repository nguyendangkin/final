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
            if (!user.googleId) {
                // Link google account to existing user if needed, or just update info
                user.googleId = details.googleId;
                user.avatar = details.picture;
                if (!user.name) {
                    user.name = `${details.firstName} ${details.lastName}`;
                }
                await this.usersService.create(user); // utilizing create for save/update simple logic
            } else if (!user.name) {
                // Even if linked, update name if missing
                user.name = `${details.firstName} ${details.lastName}`;
                await this.usersService.create(user);
            }
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
