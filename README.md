# HP Themes — WordPress Custom Theme

Custom WordPress theme được phát triển bởi **HP Dev** dành cho website doanh nghiệp & marketing.

- **Version:** 4.2.6
- **Site:** https://hpdev.name.vn
- **Author:** [HP Dev](https://hpdev.com/)

---

## Yêu cầu hệ thống

| Thành phần | Phiên bản |
|---|---|
| WordPress | 5.x trở lên |
| PHP | 7.2+ |
| MySQL/MariaDB | 5.7+ |
| Plugin bắt buộc | Advanced Custom Fields Pro, Kirki |

---

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/luonghoangphat2001/hpdev.git
```

### 2. Copy theme vào WordPress

Copy thư mục `wp-content/themes/hpthemes/` vào WordPress installation của bạn:

```
wp-content/
└── themes/
    └── hpthemes/   ← copy vào đây
```

### 3. Kích hoạt theme

Vào **WordPress Admin → Appearance → Themes** → Activate **HP themes**.

### 4. Cài đặt plugins bắt buộc

- Advanced Custom Fields Pro
- Kirki Customizer Framework
- Contact Form 7
- Yoast SEO

### 5. Cấu hình trang

Vào **Settings → Reading** → đặt trang chủ tĩnh (Static page).

---

## Cấu trúc theme

```
hpthemes/
├── functions.php           # Entry point — định nghĩa constants, load autoloader
├── __autoload.php          # Autoloader — load toàn bộ controllers, modules, helpers
├── app/
│   ├── controllers/        # Business logic (Elements, UserRole, Notice)
│   ├── ajax/               # AJAX handlers (add-to-cart, v.v.)
│   ├── helpers/            # Tiện ích (API, Scripts, User, Optimize)
│   ├── modules/widgets/    # Hệ thống widget tuỳ chỉnh
│   └── api/                # REST API endpoints
├── core/
│   ├── classes/            # Hp_Core, Setup_Theme (bootstrap chính)
│   ├── config.php          # Đăng ký assets toàn cục (CSS/JS)
│   ├── hooks.php           # Toàn bộ add_action / add_filter
│   ├── functions.php       # Hàm tiện ích (pagination, view count, v.v.)
│   └── admin/              # Giao diện quản trị riêng
├── partials/               # Template partials tái sử dụng
├── page-template/          # Custom page templates
├── woocommerce/            # Override template WooCommerce
├── public/                 # Assets tĩnh (CSS, JS, images)
└── template/               # Prototype HTML/CSS/JS (frontend độc lập)
```

---

## Phát triển

Dự án **không dùng build system** — chỉnh sửa trực tiếp các file PHP/CSS/JS.

### Frontend prototype (không cần WordPress)

Mở các file HTML trong thư mục `template/` để xem giao diện:

```
template/
├── home.html
├── about.html
├── menu.html
└── js/module/   # ~18 ES6 modules (Swiper, AOS, Gallery, Tab, Header...)
```

### Thêm asset mới

Đăng ký trong `core/config.php` (dùng cho toàn site):

```php
$GLOBALS['hp_styles'][] = [
    'handle' => 'ten-style',
    'src'    => HP_THEME_PATH . '/public/css/ten-style.css',
    'ver'    => THEME_VERSION,
];
```

Dùng `ConditionalScriptsHelper` nếu muốn load asset theo trang cụ thể.

### Thêm AJAX handler

Tạo file mới trong `app/ajax/`, file sẽ tự động được load bởi autoloader.

### Thêm REST API endpoint

Đăng ký route trong `app/helpers/APIHelpers.php`, namespace: `advanced-monatheme`.

---

## Tính năng chính

- **Coming Soon mode** — bật/tắt qua admin, admin bypass tự động
- **Custom Widget System** — hỗ trợ 9 loại field (Text, Image, Gallery, Repeater, Group...)
- **WooCommerce** — 22 file template override, AJAX add-to-cart
- **REST API** — đăng ký, đăng nhập, quên/reset mật khẩu
- **Admin Panel riêng** — quản lý 404, Buttons, Coming Soon

---

## Git workflow

Repository chỉ track thư mục `wp-content/themes/hpthemes/`.
WordPress core, plugins và file backup **không được commit**.

```bash
# Sau khi chỉnh sửa theme
git add wp-content/themes/hpthemes/
git commit -m "feat: mô tả thay đổi"
git push origin main
```
