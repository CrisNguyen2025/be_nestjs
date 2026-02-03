import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthenticationService } from './services/authen.service';
import { EmailService } from './services/email.service';
import { TokenManagementService } from './services/token-management.service';
import { UtilitiesService } from './services/utilities.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
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
    EmailService,
    JwtStrategy,
    ...(process.env.JWT_REFRESH_SECRET ? [JwtRefreshStrategy] : []),
    ...(process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CALLBACK_URL
      ? [GoogleStrategy]
      : []),
  ],
  exports: [
    AuthenticationService,
    AuthRepository,
    TokenManagementService,
    UtilitiesService,
    JwtStrategy,
    JwtModule,
  ],
})
export class AuthModule {}
