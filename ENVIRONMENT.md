# Mirador multi user

Available environment variables for Mirador Multi User. These can be set in the `.env` file before launching the application.

We provide suitable dev config in `.env.dev.sample` and production config in `.env.prod.sample`. You can copy the one you need and customize it with your own values. Do NOT commit secrets to the repository.

---

## Quick checklist

- Copy one of the sample files (`.env.dev.sample` or `.env.prod.sample`) to `.env` and edit values.
- Ensure secrets (JWT, DB password, OIDC client secret, SMTP password) are set in `.env` and never committed.
- For production, make sure `JWT_SECRET`, `JWT_EMAIL_VERIFICATION_TOKEN_SECRET`, and `DB_PASS` are set and strong.

---

### Docker / Compose & runtime

These variables control how the project is launched and what ports are used in local (non-Traefik) setups.

| Key | Description | Example / Default |
|---|---:|---|
| `COMPOSE_FILE` | Which compose files to load (dev/prod variants) | `docker-compose.yml:dev.yml:port.yml` (dev) |
| `RESTART` | Docker restart policy for containers | `no` (dev) / `always` (prod) |
| `PORT` | Frontend port (only used without Traefik) | `4000` |
| `BACKEND_PORT` | Backend port (only used without Traefik) | `3000` |
| `CADDY_PORT` | Local Caddy port (only used without Traefik) | `9000` |

---

### HTTP / Hosting

| Key | Description | Default / Example |
|---|---:|---|
| `HTTP_PROTOCOL` | Protocol used by services when not behind Traefik | `http` (dev) / `https` (prod) |
| `NAME` | Instance short name (used with Traefik) | `mmu` (prod sample) |
| `HOST` | Public URL of the frontend | `localhost:4000` (dev) / `mmu.your-domain.com` (prod) |
| `BACKEND_NAME` | Internal name for the backend container | `mmu-backend` (prod sample) |
| `BACKEND_HOST` | Public URL of backend | `localhost:3000` (dev) / `mmu-backend.your-domain.com` (prod) |
| `CADDY_NAME` | Internal name for the Caddy container | `mmu-caddy` (prod sample) |
| `CADDY_HOST` | Public URL of Caddy | `localhost:9000` (dev) / `mmu-caddy.your-domain.com` (prod) |

---

### Shared / Platform info

| Key | Description | Default / Example |
|---|---:|---|
| `INSTANCE_SHORT_NAME` | Short name for display purposes | `MMU` |
| `INSTANCE_NAME` | Full instance name | `Mirador Multi User` |

---

### Backend configuration

| Key | Description | Default / Example |
|---|---:|---|
| `LOG_LEVEL` | 0=ERROR, 1=WARN, 2=DEBUG, 3=LOG, 4=VERBOSE | `2` (dev), `0` (prod) |
| `MAX_API_PAYLOAD_SIZE` | Max JSON payload size (in MB) | `50` |
| `SALT` | Bcrypt salt rounds for password hashing | `10` |
| `MAX_UPLOAD_SIZE` | Max file upload size (in MB) | `5` |
| `ALLOW_CREATE_USER` | Enable/disable account creation | `true` |
| `ALLOW_YOUTUBE_MEDIA` | Allow adding YouTube videos as media | `true` |
| `ALLOW_PEERTUBE_MEDIA` | Allow adding PeerTube videos as media | `true` |

Security / auth-related variables (secrets) — do NOT commit these:

| Key | Description | Notes |
|---|---:|---|
| `JWT_SECRET` | Secret used to sign authentication tokens | REQUIRED for production; set a strong secret in `.env` (masked in docs) |
| `JWT_EMAIL_VERIFICATION_TOKEN_SECRET` | Secret used to sign email verification tokens | REQUIRED for production |
| `SESSION_SECRET` | Session secret (used for OIDC/session security) | Set when using sessions / OIDC |

---

### SMTP (Email) configuration — used for account confirmation and password reset

These settings are required if you want email verification / password reset to work. 

| Key | Description | Example / Notes |
|---|---:|---|
| `SMTP_DOMAIN` | SMTP server hostname | `mail.gandi.net` (example) |
| `SMTP_USER` | SMTP username | `mmu@your-domain.fr` or your SMTP login |
| `SMTP_PASSWORD` | SMTP password | Set in `.env` (secret — do NOT commit) |
| `SMTP_PORT` | SMTP port (often 587 or 465) | `587` |
| `SMTP_IGNORE_TLS` | Set to `true` to skip TLS when connecting | `false` |
| `SMTP_SSL` | Use SSL for SMTP | `false` or `true` depending on provider |
| `FROM_MAIL` | Email used as the sender | `mmu@your-domain.fr` |
| `NAME_MAIL` | Display name for sender emails | `Mirador Multi User` |
| `ADMIN_MAIL` | Admin email that receives notifications | `mmu@your-domain.fr` |

Note: The dev sample has SMTP values empty by default to avoid accidental email sending.

---

### Swagger (API docs)

| Key | Description | Default |
|---|---:|---|
| `SWAGGER_RELATIVE_PATH` | Path where Swagger UI is served | `api` |
| `SWAGGER_TITLE` | Title of the API docs | `Mirador MultiUsers API` |
| `SWAGGER_DESCRIPTION` | Description shown in Swagger | `API Documentation for Mirador MultiUsers (MMU)` |
| `SWAGGER_VERSION` | API version | `0.1` |

---

### External / UI links

| Key | Description |
|---|---:|
| `EXTERNAL_DASHBOARD_URL` | Optional link to external dashboards/tools |
| `ACCOUNT_MANAGEMENT_URL` | Optional link to account management page (e.g., password reset) |

---

### YouTube / media

| Key | Description | Example |
|---|---:|---|
| `YOUTUBE_API_KEY` | API key needed to add YouTube videos as media | (optional) |

---

### Authentication modes

You can enable one or both authentication methods.

| Key | Description | Values |
|---|---:|---|
| `OPENID_CONNECTION` | Enable OpenID Connect login | `true`/`false` |
| `CLASSIC_AUTHENTICATION` | Enable classic email/password login | `true`/`false` |

If using OpenID Connect, set these (OIDC values often differ between dev and prod):

| Key | Description |
|---|---:|
| `OIDC_ISSUER` | URL of your OIDC identity provider |
| `OIDC_CLIENT_ID` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | OIDC client secret (secret — do NOT commit) |
| `OIDC_REDIRECT_URI` | Redirect URI for the OIDC callback |

The repository dev `.env` contains a test Keycloak issuer and client id for local testing; replace these when deploying to production.

---

### Database

| Key | Description | Default / Example |
|---|---:|---|
| `DB_USER` | Database username | `mirador` |
| `DB_PASS` | Database password | REQUIRED (set in `.env`; do NOT commit) |
| `DB_DATABASE` | Database name | `multiUsers` |
| `DB_HOST` | Hostname of the database container | `db` |
| `DB_EXPOSE_PORT` | Exposed DB port (for DBeaver, etc.) | `3306` |

---

### Caddy (static file server used for uploads)

| Key | Description | Default / Example |
|---|---:|---|
| `HTTP_FOLDER` | Path to public files served by Caddy | `./backend/upload` (dev), `./upload` (prod sample) |
| `LOG_FOLDER` | Path to Caddy logs | `./logs` |
| `CORS_ALLOWED_HOSTS` | Whitelisted origins for static file access | `*` (accept all) |
| `CADDY_HTTP_PROTOCOL` | HTTP or HTTPS for Caddy | `http` (dev) / `https` (prod) |

---

### Custom Assets

Place custom UI assets in the `customAssets/` folder (frontend). Typical files:
- `favicon.svg`
- `landing-background.webp`
- `CustomTerms.tsx`
- `Consent.tsx`

---

### Notes & Best practices

- Never commit `.env` to source control. Add `.env` to `.gitignore` if not already ignored.
- Treat `JWT_SECRET`, `JWT_EMAIL_VERIFICATION_TOKEN_SECRET`, `SESSION_SECRET`, `OIDC_CLIENT_SECRET`, `SMTP_PASSWORD`, and `DB_PASS` as secret values and rotate them when needed.
- Use the provided `.env.dev.sample` for local development. Use `.env.prod.sample` as a starting point for production and adapt values for Traefik / your domain.

