# YiBu

Nền tảng mạng xã hội full-stack (React/Vite + Node/Express + MongoDB/Redis) chạy tốt với Docker Compose.

## Quick Start (Docker)

Yêu cầu: Docker Desktop.

1. Tạo file env cho Docker Compose (ở repo root):

```bash
cp .env.example .env
```

2. (Tuỳ chọn) điền `CLOUDINARY_*` để upload avatar/cover hoạt động.
3. Chạy toàn bộ stack:

```bash
docker compose up -d --build
```

Service sau khi chạy:

- Client: `http://localhost:3000` (container chạy Vite ở `9258`, được map ra host `3000`)
- Server API: `http://localhost:5000` (base path: `/api/v2`)
- MongoDB (host): `mongodb://localhost:27018` (container: `mongo:27017`, replica set `rs0`)
- Redis: `redis://localhost:6379`

## Features

- Auth: register/login, JWT access/refresh (cookie)
- Feed + posts: tạo bài viết, tương tác (like/comment/save)
- Follow + profile: follow/unfollow, chỉnh sửa hồ sơ
- Hashtags: trending + explore theo hashtag
- Realtime: Socket.IO (notification/messages)
- Admin dashboard (tuỳ quyền)

## Seed/Fake Data

Repo có sẵn seed bằng `@faker-js/faker` để tạo dữ liệu demo.

Chạy seed (1 lần) trên Docker:

```bash
docker compose run --rm seed
```

Chạy seed và xoá data cũ trước khi tạo lại:

```bash
docker compose run --rm seed --drop
```

## Local Dev (Không dùng Docker)

Yêu cầu: Node.js 20+, MongoDB, Redis.

1. Backend:

```bash
cd server
npm install
npm run dev
```

Backend đọc env từ `server/.env` và `server/.env.development` (tuỳ `NODE_ENV`). Xem `server/src/configs/config.js`.

2. Frontend:

```bash
cd client
npm install
npm run dev
```

Mặc định Vite chạy ở `http://localhost:9258` và proxy `/api` + `/socket.io` sang `http://localhost:5000` (có thể đổi bằng `VITE_PROXY_TARGET`).

## Tech Stack

Frontend (`/client`)

- React (Vite)
- Tailwind CSS
- Redux Toolkit + redux-persist
- TanStack React Query
- React Router
- Socket.IO client

Backend (`/server`)

- Node.js + Express
- MongoDB (Replica Set cho transaction)
- Redis
- JWT access/refresh + cookie auth
- Socket.IO
- Upload media: Cloudinary
- Security: Helmet, rate limit, sanitize/xss/hpp

## Configuration (Docker Compose)

Docker Compose sẽ tự đọc biến môi trường từ file `.env` ở repo root.

| Biến | Mục đích |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (upload avatar/cover/post media) |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `ACCESS_TOKEN_SECRET` | JWT access secret (Docker có default dev, nên override khi deploy thật) |
| `REFRESH_TOKEN_SECRET` | JWT refresh secret (Docker có default dev, nên override khi deploy thật) |
| `EMAIL_HOST` | SMTP host (tuỳ chọn) |
| `EMAIL_PORT` | SMTP port |
| `EMAIL_USER` | SMTP user |
| `EMAIL_PASS` | SMTP pass/app password |

## Hashtag Sync (Docker)

Docker Compose đã bật service `hashtags-sync-scheduler` để tự đồng bộ hashtag theo post.

- Interval: `HASHTAGS_SYNC_INTERVAL_SEC` (default 900s)
- Prune tag không còn post: `HASHTAGS_SYNC_PRUNE` (default `true`)

## Useful Commands

- Rebuild 1 service:

```bash
docker compose up -d --build server
docker compose up -d --build client
```

- Xem logs:

```bash
docker compose logs -f server
docker compose logs -f client
```

## Server Scripts (Local)

Chạy trong `server/`:

```bash
npm run seed
npm run seed:drop
npm run hashtags:sync
npm run hashtags:sync:prune
```

## Troubleshooting

- `Cloudinary is not configured`: bạn chưa set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `.env` (repo root khi chạy Docker Compose).
- `ACCESS_TOKEN_SECRET is not configured`: bạn đang chạy server mà thiếu `ACCESS_TOKEN_SECRET`. Với Docker Compose đã có default dev; với local dev hãy set trong `server/.env.development` hoặc `server/.env`.
- `JWT verification failed invalid signature`: thường xảy ra khi bạn đổi secret nhưng client vẫn giữ cookie/token cũ. Thử logout/login lại, hoặc clear cookies.

## License

ISC (xem `server/package.json`).

## Project Structure

```
YiBu/
  client/            # React Frontend (Vite)
  server/            # Node.js Backend (Express/Mongoose)
  docker-compose.yaml
  .env.example       # Mẫu env cho Docker Compose (root)
  docs/
```
