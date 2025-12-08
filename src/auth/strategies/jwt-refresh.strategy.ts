import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: Record<string, any>) {
    const authorizationHeader = req.headers.authorization;
    const refreshToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.replace('Bearer ', '').trim()
      : null;

    if (!refreshToken) {
      throw new Error('Refresh token is missing');
    }

    return { ...payload, refreshToken };
  }
}
