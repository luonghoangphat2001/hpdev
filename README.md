# HP Dev Demo

## Docker

Run the local stack with:

```bash
docker compose up -d
```

Then open:

```text
http://localhost:8080/hpdevdemo
```

The WordPress container uses the `db` service for MariaDB and mounts this folder at `/var/www/html/hpdevdemo`.
