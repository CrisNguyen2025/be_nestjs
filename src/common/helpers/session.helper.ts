export class SessionHelper {
  static async getUserSessions(redis: any, userId: string) {
    return await redis.keys(`refresh:${userId}:*`);
  }

  static async enforceSessionLimit(redis: any, userId: string, limit = 2) {
    const sessions = await redis.keys(`refresh:${userId}:*`);

    if (sessions.length > limit) {
      // Sort by TTL để xác định session cũ
      const sessionsWithTtl = await Promise.all(
        sessions.map(async (key) => ({
          key,
          ttl: await redis.ttl(key),
        })),
      );

      // TTL nhỏ tức là sắp hết hạn → session cũ hơn → xoá trước
      sessionsWithTtl.sort((a, b) => a.ttl - b.ttl);

      // xoá session thừa
      const needDelete = sessionsWithTtl.length - limit;
      const oldSessions = sessionsWithTtl.slice(0, needDelete);

      for (const s of oldSessions) {
        await redis.del(s.key);
        console.log('Deleted old session:', s.key);
      }
    }
  }
}
