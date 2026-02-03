import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import Redis from 'ioredis';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string; jti?: string }): Promise<{
    userId: string;
    email: string;
  }> {
    if (payload.jti) {
      const isBlacklisted = await this.redisClient.get(
        `bl:access:${payload.jti}`,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Token revoked');
      }
    }

    return { userId: payload.sub, email: payload.email };
  }
}
