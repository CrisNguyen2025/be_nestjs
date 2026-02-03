import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async saveMessage(userId: number, room: string, content: string) {
    return this.prisma.message.create({
      data: {
        senderId: userId,
        room,
        content,
      },
      include: {
        sender: {
          select: { id: true, email: true },
        },
      },
    });
  }

  async getRecentMessages(room: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { room },
      take: limit,
      orderBy: { createdAt: 'desc' }, // Get latest
      include: {
        sender: {
          select: { id: true, email: true },
        },
      },
    });
  }
}
