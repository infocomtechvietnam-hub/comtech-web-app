# COMTECH CRM

Hệ thống quản lý quan hệ khách hàng (CRM) nội bộ của **COMTECH Vietnam**.

Kho mã nguồn dạng **monorepo** (pnpm workspaces) gồm:

| Package | Mô tả | Công nghệ |
| --- | --- | --- |
| `apps/web` | Ứng dụng web (giao diện người dùng) | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| `apps/api` | Máy chủ API | NestJS, Prisma, PostgreSQL |
| `packages/types` | Kiểu dữ liệu TypeScript dùng chung | TypeScript |

> Toàn bộ giao diện và thông báo lỗi được hiển thị bằng **tiếng Việt**. Màu chủ đạo: `#FA9D0E`.

---

## Milestone 1 — Phạm vi đã hoàn thành

**Xác thực (Authentication)**
- Đăng nhập / đăng xuất, JWT access token (15 phút) + refresh token (7 ngày) lưu trong HttpOnly cookie.
- Băm mật khẩu bằng `bcrypt` (cost 12).
- Tự động khóa tài khoản 15 phút sau **5 lần** đăng nhập sai.
- Quên mật khẩu / đặt lại mật khẩu (token có hiệu lực 30 phút, ghi ra console ở môi trường dev).
- Giới hạn tần suất (throttler) 10 request/phút cho các route xác thực.

**Phân quyền (RBAC)**
- `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard` (đăng ký toàn cục).
- 5 vai trò: Quản trị viên, Quản lý, Nhân viên, Nhân sự, Quản lý Nhân sự.
- Ma trận quyền đầy đủ (`resource:action:scope`). Trả về HTTP 403 với thông điệp tiếng Việt.

**Quản lý người dùng**
- CRUD người dùng, khóa/mở khóa tài khoản, endpoint `/users/me` (chỉ quản trị viên với danh sách).
- Danh sách phòng ban (`GET /departments`).
- `AuditLogInterceptor` ghi nhật ký thao tác.

**Giao diện (Frontend)**
- Trang: Đăng nhập, Quên mật khẩu, Đặt lại mật khẩu, Tổng quan, Quản lý người dùng, Hồ sơ cá nhân.
- Sidebar thu gọn được (nền tối), header có chuông thông báo + menu tài khoản, menu hiển thị theo vai trò.
- Responsive (360 / 768 / 1280 px). Middleware định tuyến + bảo vệ phía client.

---

## Yêu cầu môi trường

- **Node.js** >= 18 (khuyến nghị 20+)
- **pnpm** >= 9 — `npm install -g pnpm@9`
- **PostgreSQL** 15 (khuyến nghị chạy bằng Docker Compose kèm theo)

---

## Cài đặt & chạy dự án (local)

```bash
# 1. Cài đặt dependencies cho toàn bộ workspace
pnpm install

# 2. Tạo file cấu hình môi trường
cp .env.example .env
cp .env.example apps/api/.env        # chỉnh sửa nếu cần
# apps/web/.env.local:  NEXT_PUBLIC_API_URL="http://localhost:4000/api"

# 3. Khởi động PostgreSQL bằng Docker
docker compose up -d          # (hoặc: pnpm db:up)

# 4. Tạo schema database + dữ liệu mẫu
cd apps/api
pnpm prisma generate
pnpm prisma migrate deploy    # hoặc: pnpm prisma migrate dev
pnpm prisma:seed              # tạo 5 vai trò, ma trận quyền, 3 phòng ban, 10 người dùng
cd ../..

# 5. Chạy song song web + api ở chế độ phát triển
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000/api

> Nếu `pnpm prisma ...` báo lỗi trong workspace, hãy chạy trực tiếp trong `apps/api`:
> `./node_modules/.bin/prisma migrate dev` và `./node_modules/.bin/ts-node prisma/seed.ts`.

---

## Tài khoản mẫu (sau khi seed)

| Email | Mật khẩu | Vai trò |
| --- | --- | --- |
| `admin@comtech.vn` | `Admin@123456` | Quản trị viên |
| `manager1@comtech.vn` | `Manager@123456` | Quản lý (Kinh doanh) |
| `sales1@comtech.vn` | `Sales@123456` | Nhân viên |
| `hr@comtech.vn` | `Hr@123456` | Nhân sự |
| `hr_manager@comtech.vn` | `HrManager@123456` | Quản lý Nhân sự |

(Xem thêm các tài khoản khác trong `apps/api/prisma/seed.ts`.)

---

## Scripts hữu ích (ở thư mục gốc)

| Lệnh | Mô tả |
| --- | --- |
| `pnpm dev` | Chạy web + api đồng thời |
| `pnpm build` | Build toàn bộ |
| `pnpm db:up` / `pnpm db:down` | Bật/tắt PostgreSQL (Docker) |
| `pnpm prisma:seed` | Tạo dữ liệu mẫu |

---

## Cấu trúc thư mục

```
comtech-web-app/
├── apps/
│   ├── api/           # NestJS + Prisma
│   │   ├── prisma/    # schema, migrations, seed
│   │   └── src/       # modules: auth, users, departments, common (guards, interceptors)
│   └── web/           # Next.js App Router
│       └── src/app/   # (auth) + (app) route groups
├── packages/
│   └── types/         # kiểu dữ liệu dùng chung @comtech/types
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```
