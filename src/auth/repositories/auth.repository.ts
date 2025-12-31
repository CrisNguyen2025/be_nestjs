import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from '../dto/create-user';
import { IAuthRepository } from '../interfaces/auth.inteface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByEmailVerificationTokenHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: { emailVerifyTokenHash: tokenHash },
    });
  }

  async createUser(data: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        role: data.role || Role.USER,
      },
    });
  }

  async findById(userId: string) {
    const id = parseInt(userId, 10);
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        emailVerifiedAt: true,
        emailVerifyTokenHash: true,
        emailVerifyCodeHash: true,
        emailVerifyExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, data: Prisma.UserUpdateInput) {
    const id = parseInt(userId, 10);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
      },
    });
  }

  async findByIdWithPassword(userId: string) {
    const id = parseInt(userId, 10);
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    const id = parseInt(userId, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
