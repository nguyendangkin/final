import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

interface GoogleProfile {
  googleId: string;
  email: string;
  displayName: string;
  avatar?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findPublicById(id: string): Promise<{
    id: string;
    displayName: string;
    avatar: string | null;
    createdAt: Date;
  } | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'displayName', 'avatar', 'createdAt'],
    });
    return user;
  }

  async createFromGoogle(profile: GoogleProfile): Promise<User> {
    const user = this.userRepository.create({
      googleId: profile.googleId,
      email: profile.email,
      displayName: profile.displayName,
      avatar: profile.avatar,
    });
    return this.userRepository.save(user);
  }

  async findOrCreateFromGoogle(profile: GoogleProfile): Promise<User> {
    let user = await this.findByGoogleId(profile.googleId);
    if (!user) {
      user = await this.createFromGoogle(profile);
    } else {
      // Update avatar and displayName in case they changed on Google
      user.avatar = profile.avatar ?? user.avatar;
      user.displayName = profile.displayName || user.displayName;
      await this.userRepository.save(user);
    }
    return user;
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }
}

