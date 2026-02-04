# Admin UI Refactor

## Goals
- Đồng bộ UI/UX Admin với User (tone, spacing, button/inputs, color tokens).
- Loại bỏ toàn bộ màu `purple/violet/indigo`.
- Sửa các lỗi A11y chính: label/input, alt cho ảnh, keyboard support.

## Scope
- Admin layout, shared components, dashboard, system pages, users, posts, reports.
- Common components bị ảnh hưởng bởi A11y/Color.

## Decisions
- Primary action dùng `bg-primary`/`text-primary-foreground` (đen/trắng).
- Semantic colors giữ ở mức cần thiết: `emerald`, `amber`, `rose`.
- Các view Admin giữ card style đồng nhất (`rounded-2xl`, `border`, `bg-white/dark:bg-neutral-900`).

## Checks
- Chạy `ux_audit.py` + `accessibility_checker.py` sau khi refactor.
