# FinanTech S.A. — Frontend

Next.js (panel empresa + portal cliente).

## Coolify

1. Resource → **Dockerfile** o **Docker Compose**
2. Repo: `https://github.com/zRipWolfx/-FinanTech-FN`
3. Base Directory: vacío
4. Dockerfile: `Dockerfile` (o Compose: `docker-compose.yml`)
5. Port: `3000`
6. **Build Argument** `API_URL` = URL del backend, ej. `https://api.finan.mtasoftware.cloud`
7. Dominio: `https://finan.mtasoftware.cloud`

Despliega el backend primero. Si cambias `API_URL`, haz rebuild del front.

## Local

```bash
# API_URL = backend alcanzable desde el contenedor
docker compose up -d --build
```
