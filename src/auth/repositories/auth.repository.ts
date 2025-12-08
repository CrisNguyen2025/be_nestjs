import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user';
import { IAuthRepository } from '../interfaces/auth.inteface'; // Đã cập nhật IAuthRepository

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Find user by email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // 2. Create user with ACCOUNT/PASSWORD (registerWithCredentials)
  async createUser(data: CreateUserDto) {
    // Hash password before saving to repository
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || Role.USER,
      },
    });
  }

  // 3. Find by id use for (getMe, refreshToken, logout, ...etc
  async findById(userId: string) {
    const id = parseInt(userId, 10);
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        //... etc
      },
    });
  }

  // 4. update user (update, use for changePassword)
  async update(userId: string, data: any) {
    const id = parseInt(userId, 10);

    // Hash password before saving to repository
    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }
}
