# HP Dev Demo

Website WordPress dùng theme custom `wp-content/themes/hpthemes`, dữ liệu export WordPress và local MariaDB. Repository này không chứa một ứng dụng Node riêng; môi trường local được chạy bằng Docker Compose.

## Thành phần

```text
docker-compose.yml                 # WordPress + MariaDB
docker/wp-config.php               # wp-config cho local
wp-content/themes/hpthemes/        # custom theme PHP/CSS/JS/assets
data/wp-export/                    # export page, post, project
```

## Chạy local

Yêu cầu Docker Desktop hoặc Docker Engine có Compose plugin.

```bash
cd ai_dan/hpdevdemo
docker compose up -d
docker compose ps
```

Mở website tại [http://localhost:8080/hpdevdemo](http://localhost:8080/hpdevdemo). WordPress container mount repository vào `/var/www/html/hpdevdemo`; MariaDB lưu dữ liệu trong volume Docker `hpdevdemo_db_data`.

Thông tin database local được cấu hình trong `docker-compose.yml`:

```text
host: db:3306
database: hpdevdemo
user: hpdevdemo
password: hpdevdemo
```

Đây là credential local/dev, không dùng cho production.

## Lưu ý khi khởi tạo dữ liệu

Compose chỉ khởi động WordPress và MariaDB; các file trong `data/wp-export/` không tự động import. Nếu database volume mới, hoàn tất WordPress setup rồi import dữ liệu export bằng công cụ WordPress phù hợp. Khi chạy lại, volume MariaDB giữ nguyên dữ liệu:

```bash
docker compose down           # dừng và xóa container, giữ volume
docker compose up -d
```

Muốn xem log:

```bash
docker compose logs -f wordpress
docker compose logs -f db
```

## Workflow production

`.github/workflows/deploy.yml` chạy khi push vào nhánh `main`. Job SSH:

1. vào `/home/hpdev/public_html`;
2. chạy `git pull origin main`;
3. tạo `wp-content/themes/hpthemes/.sync-trigger` để kích hoạt đồng bộ/reload theme.

Workflow yêu cầu GitHub secrets `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PRIVATE_KEY` và tùy chọn `SSH_PASSPHRASE`. Local Docker Compose không được sử dụng trong workflow production.

## An toàn

Không commit credential production, database dump chứa dữ liệu thật hoặc file `.env`. Trước khi deploy, kiểm tra đường dẫn asset/URL WordPress vì dữ liệu export local có thể chứa URL `localhost`.
