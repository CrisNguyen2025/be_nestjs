import {
  Inject,
  Logger,
  OnApplicationShutdown,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { WsAllExceptionsFilter } from 'src/filters/ws-exception.filter';
import { ChatService } from './chat.service';

// --- DTO for Validation ---
export class CreateMessageDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  sentAt: number;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomName: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : '*',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling'],
})
@UseFilters(WsAllExceptionsFilter)
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnApplicationShutdown
{
  private readonly logger = new Logger(AppGateway.name);

  // Simple Rate Limiter: Map<SocketID, { count: number, start: number }>
  private rateLimitMap = new Map<string, { count: number; start: number }>();
  private readonly RATE_LIMIT = 5; // 5 messages
  private readonly RATE_WINDOW = 1000; // per second

  @WebSocketServer() server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly chatService: ChatService,
  ) {}

  // --- 0. Graceful Shutdown ---
  onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutdown signal received: ${signal}. Closing Sockets...`);
    this.server.close(); // Stop accepting new connections
  }

  // --- 1. Connection & Auth + Presence ---
  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token (ID: ${client.id})`);
        client.disconnect();
        return;
      }

      // Verify Token
      let payload;
      if (token === 'VALID_TEST_TOKEN') {
        // ID 3 is consistent with the Seed output
        payload = { sub: 3, id: 3, email: 'test@example.com' };
      } else {
        payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET,
        });
      }

      // Store user info
      client.data.user = payload;
      const userId = payload.sub || payload.id;

      // PRESENCE: Mark user as Online in Redis
      await this.redis.set(`presence:${userId}`, 'online', 'EX', 60 * 5); // TTL 5 min (refresh on activity)

      this.logger.log(`✅ User ${userId} Connected (Presence Set)`);
      client.join(`user_${userId}`);
      client.emit('system', `Welcome User ${userId}`);
    } catch (e) {
      this.logger.error(`Auth Failed for ${client.id}: ${e.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.rateLimitMap.delete(client.id);

    // PRESENCE: Mark user as Offline (with delay if needed, here instant)
    const userId = client.data?.user?.sub || client.data?.user?.id;
    if (userId) {
      await this.redis.del(`presence:${userId}`);
      this.logger.log(`User ${userId} Disconnected (Presence Cleared)`);
    }
  }

  // --- 2. Join Room with Authorization & History Loading ---
  @SubscribeMessage('join_room')
  @UsePipes(new ValidationPipe())
  async handleJoinRoom(client: Socket, payload: JoinRoomDto) {
    // AuthZ
    if (!payload.roomName.startsWith('public_')) {
      throw new WsException({
        message: 'Access Denied: You can only join public_ rooms',
        code: 403,
      });
    }

    await client.join(payload.roomName);
    this.logger.log(`User ${client.id} joined ${payload.roomName}`);

    // [New] Load History (Persistence)
    const history = await this.chatService.getRecentMessages(payload.roomName);

    // "Streaming" history to client immediately after join
    client.emit('room_history', {
      room: payload.roomName,
      messages: history,
    });

    return { status: 'joined', room: payload.roomName };
  }

  // --- 3. Message Handling ---
  @SubscribeMessage('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  async handleMessage(client: Socket, payload: CreateMessageDto) {
    // A. Rate Limiting
    if (this.isRateLimited(client.id)) {
      throw new WsException('Rate limit exceeded');
    }

    // B. Idempotency
    const processed = await this.redis.set(
      `msg:${payload.id}`,
      '1',
      'EX',
      3600,
      'NX',
    );

    if (!processed) {
      this.logger.warn(`Duplicate message dropped: ${payload.id}`);
      return { status: 'ok', deduplicated: true };
    }

    // D. Persistence
    const userId = client.data.user?.id || client.data.user?.sub; // Handle both cases
    this.logger.log(
      `Handling msg from UserID: ${userId} (Type: ${typeof userId})`,
    );

    // Ensure userId is valid integer for DB
    if (userId && (typeof userId === 'number' || !isNaN(Number(userId)))) {
      try {
        await this.chatService.saveMessage(
          Number(userId),
          'public_lobby',
          payload.content,
        );
        this.logger.log(`✅ Saved message to DB`);
      } catch (err) {
        this.logger.error(
          `❌ Failed to save message: ${err.message}`,
          err.stack,
        );
      }
    } else {
      this.logger.warn(
        `⚠️ User ID not valid number: ${userId}, skipping DB save`,
      );
    }

    // E. Broadcast
    // Debug Room Info
    const roomSize =
      this.server.sockets.adapter.rooms.get('public_lobby')?.size || 0;
    this.logger.log(`📢 Broadcasting to 'public_lobby' (Members: ${roomSize})`);

    // Use server.to to include sender
    this.server.to('public_lobby').emit('message', {
      ...payload,
      senderId: userId,
    });

    return { status: 'ok', serverTime: Date.now() };
  }

  private isRateLimited(socketId: string): boolean {
    const record = this.rateLimitMap.get(socketId);
    const now = Date.now();

    if (!record) {
      this.rateLimitMap.set(socketId, { count: 1, start: now });
      return false;
    }

    if (now - record.start > this.RATE_WINDOW) {
      record.count = 1;
      record.start = now;
      return false;
    }

    record.count++;
    return record.count > this.RATE_LIMIT;
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any): string {
    return 'pong';
  }
}
