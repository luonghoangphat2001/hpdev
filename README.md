# 🤖 Dan API (api.hpdev.name.vn)

Backend Core API cho hệ sinh thái Đần AI với kiến trúc chuẩn **OOP & SOLID** trong ExpressJS.

Source này chỉ cung cấp REST API dưới prefix `/api`. Dashboard HTML/JavaScript cũ đã được tách sang thư mục ngang cấp `../dan-api-legacy-ui-backup/` để lưu trữ, không còn được mount vào Express hoặc đóng gói trong Docker image.

## 🌿 Nhánh Git: `api`
* Nhánh độc lập, **không merge vào `main`**.
* Triển khai tự động tới: `api.hpdev.name.vn:3000`

## 🚀 Khởi chạy Local:
```bash
npm install
npm start
# Chạy Unit Tests:
npm test
```

Health check: `GET /api/health`
