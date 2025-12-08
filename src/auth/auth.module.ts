import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthenticationService } from './services/authen.service';
import { TokenManagementService } from './services/token-management.service';
import { UtilitiesService } from './services/utilities.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || '12345',
      signOptions: { expiresIn: '1h' },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthenticationService,
    AuthRepository,
    TokenManagementService,
    UtilitiesService,
    JwtStrategy,
  ],
  exports: [
    AuthenticationService,
    AuthRepository,
    TokenManagementService,
    UtilitiesService,
    JwtStrategy,
  ],
})
export class AuthModule {}
