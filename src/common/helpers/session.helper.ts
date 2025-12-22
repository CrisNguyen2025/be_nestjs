import * as bcrypt from 'bcrypt';

export class SessionHelper {
  /**
   * Lưu session mới
   */
  static async addSession(
    redis: any,
    userId: string,
    jti: string,
    refreshToken: string,
    ttlSeconds: number,
  ) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    // 1️⃣ Store refresh token
    await redis.set(`refresh:${userId}:${jti}`, hashed, 'EX', ttlSeconds);

    // 2️⃣ Track session with timestamp
    await redis.zadd(`user:sessions:${userId}`, Date.now(), jti);
  }

  /**
   * Enforce max session limit (logout device cũ nhất)
   */
  static async enforceSessionLimit(redis: any, userId: string, limit = 2) {
    const sessionKey = `user:sessions:${userId}`;
    const total = await redis.zcard(sessionKey);

    if (total <= limit) return;

    const excess = total - limit;

    // 1️⃣ Lấy session cũ nhất
    const oldJtis: string[] = await redis.zrange(sessionKey, 0, excess - 1);

    for (const jti of oldJtis) {
      // ❌ revoke refresh token
      await redis.del(`refresh:${userId}:${jti}`);

      // ❌ revoke access token
      await redis.set(`bl:access:${jti}`, '1', 'EX', 60 * 60);

      // ❌ remove session
      await redis.zrem(sessionKey, jti);
    }
  }

  /**
   * Force logout tất cả thiết bị
   */
  static async forceLogoutAll(redis: any, userId: string) {
    const sessionKey = `user:sessions:${userId}`;
    const jtis: string[] = await redis.zrange(sessionKey, 0, -1);

    for (const jti of jtis) {
      await redis.del(`refresh:${userId}:${jti}`);
      await redis.set(`bl:access:${jti}`, '1', 'EX', 60 * 60);
    }

    await redis.del(sessionKey);
  }

  /**
   * Logout tất cả thiết bị khác (trừ device hiện tại)
   */
  static async logoutOthers(redis: any, userId: string, currentJti: string) {
    const sessionKey = `user:sessions:${userId}`;
    const jtis: string[] = await redis.zrange(sessionKey, 0, -1);

    for (const jti of jtis) {
      if (jti === currentJti) continue;

      await redis.del(`refresh:${userId}:${jti}`);
      await redis.set(`bl:access:${jti}`, '1', 'EX', 60 * 60);
      await redis.zrem(sessionKey, jti);
    }
  }
}
