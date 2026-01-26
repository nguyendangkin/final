import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async validateGoogleUser(details: any) {
    // Use SERIALIZABLE transaction to prevent race conditions
    // when multiple OAuth callbacks occur simultaneously for the same user
    return this.dataSource.transaction('SERIALIZABLE', async (manager) => {
      const userRepository = manager.getRepository(User);

      // Find user with lock to prevent concurrent modifications
      let user = await userRepository.findOne({
        where: { email: details.email },
        lock: { mode: 'pessimistic_write' },
      });

      if (user) {
        // Always update avatar and googleId to ensure they are current
        user.googleId = details.googleId;
        user.avatar = details.picture;

        // Update name if missing
        if (!user.name) {
          user.name = `${details.firstName} ${details.lastName}`;
        }

        await userRepository.save(user);
        return user;
      }

      // Create new user within the transaction
      const newUser = userRepository.create({
        email: details.email,
        name: `${details.firstName} ${details.lastName}`,
        googleId: details.googleId,
        avatar: details.picture,
      });

      return userRepository.save(newUser);
    });
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }
}
