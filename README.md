1.Prisma 6.7.0 - Postgresql ✅
2.Crud structure ✅
3.Error Handling / Logging

- AllExceptionsFilter ✅
- validationPipeRules ✅
  4.Performance / Optimizations
- Caching: Redis, query caching with Prisma
- Rate limiting: @nestjs/throttler
- Pagination: offset vs cursor (cursor with large datasets)
- Query optimization: Prisma select, include, batch queries
  5.API Documentation with swagger ✅
  6.Background Jobs / Queue
  7.Authentication & Authorization >>>>
  8.Advanced CRUD / Repository Layer
  9.Security
  10.Environment & Deployment
  11.Optional Advanced Features

Rules:

- Repo không biết JWT, bcrypt, hay các rule nghiệp vụ. Chỉ trả dữ liệu thuần từ DB.
- Service biết logic ứng dụng, repo không biết.
