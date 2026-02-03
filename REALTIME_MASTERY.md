# Realtime Mastery Roadmap (NestJS Focus)

> **Current Status**:
>
> - [x] **Setup**: Installed WebSocket & Redis.
> - [x] **Lifecycle**: Heartbeat & Basic Logs.
> - [x] **Delivery**: Ack & Client Retry (At-least-once).
> - [x] **Scaling**: Redis Adapter Configured.
> - [ ] **Security**: Auth Guard (Next Step).

---

## 1. Lifecycle: Connect / Auth / Join / Heartbeat / Reconnect / Resubscribe

**Mục tiêu**: Quản lý vòng đời kết nối an toàn và tin cậy.

- [x] **Connect & Heartbeat**: `pingInterval: 10000` (Done).
- [ ] **Auth**: Validate Token khi handshake (Chưa làm).
- [x] **Reconnect**: Client tự reconnect (Done).
- [ ] **Resubscribe / State Recovery**:
  - Khi client reconnect, server cần biết client này là `UserId: 123` để tự động `socket.join('user_123')`.
  - **Task**: Implement logic trong `handleConnection` đọc `handshake.query.userId` hoặc `auth.token`.

## 2. Delivery Semantics + Idempotency

**Mục tiêu**: Đảm bảo tin không mất, không trùng.

- [x] **At-least-once**:
  - Client gửi với `ack`.
  - Nếu timeout -> Retry. (Đã implement ở Client).
- [ ] **Idempotency / De-dup**:
  - Server cần cache `messageId` đã xử lý (Set Redis EX 10s).
  - Nếu nhận lại ID cũ -> Return Ack ngay, không xử lý business logic.

## 3. Scale-out: Sticky + Pub/Sub Adapter

**Mục tiêu**: 1 user ở Server A chat được với user ở Server B.

- [x] **Redis Adapter**: Đã cấu hình `RedisIoAdapter` trong `main.ts` và `src/gateways`.
- [ ] **Sticky Session**: Khi deploy Production (K8s/Nginx), cần config `ip_hash`. (Local Docker không cần).

## 4. Backpressure + Rate Limiting + Drop Policy

**Mục tiêu**: Chống quá tải.

- [ ] **Rate Limiting**: Dùng `ThrottlerModule` chặn user spam (ví dụ 10 msg/s).
- [ ] **Drop Policy**: Nếu Queue quá đầy (client đọc chậm), drop message cũ nhất (hoặc drop theo priority).
- [ ] **Max Payload**: Giới hạn size message (1MB).

## 5. AuthZ per Room, Token Expiry/Refresh, Kick/Revoke

**Mục tiêu**: Kiểm soát quyền truy cập chi tiết.

- [ ] **Guard**: Viết `WsJwtGuard`.
- [ ] **Room Auth**: Check `CanUserJoinRoom(userId, roomId)`.
- [ ] **Revoke**: API Admin kick user -> `adapter.remoteDisconnect(socketId)`.

## 6. Observability: Metrics/Logs/Tracing + Load Test

**Mục tiêu**: "Thấy" được sức khỏe hệ thống.

- [ ] **Metrics**: Export số connection, error rate ra Prometheus.
- [ ] **Logs**: Log struct JSON cho mọi event quan trọng.

## 7. Security: Origin/TLS/DoS/Payload Validation

**Mục tiêu**: Phòng thủ.

- [x] **Origin process**: CORS configured.
- [ ] **Payload Validation**: Dùng Zod/DTO check input data.
- [ ] **DoS**: Rate limit connect request.

---

**Next Actions**:

1. Run Docker Build to fix `main.ts` (Done).
2. Implement **Auth Guard** (Step 6 plan).
