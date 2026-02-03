import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { ChatService } from './chat.service';

import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [AppGateway, ChatService],
  exports: [AppGateway],
})
export class GatewaysModule {}
