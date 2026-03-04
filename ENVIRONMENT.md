# Mirador multi user

Available environment variables for Mirador Multi User. These can be set in the `.env` file before launching the application.

We provide suitabe dev config in `.env.dev.sample` and production config in `.env.prod.sample`. You can copy the one you need and customize it with your own values.

# Table of Contents



### 🔐 Required Environment Variables

These **must be set manually** before launching in production:

| Key                                   | Description                                   |
|---------------------------------------|-----------------------------------------------|
| `JWT_SECRET`                          | Secret used to sign authentication tokens     |
| `JWT_EMAIL_VERIFICATION_TOKEN_SECRET` | Secret used to sign email verification tokens |
| `DB_PASS`                             | Password for the database user                |

---

### 🛠️ Core Application Settings

| Key                   | Description                             | Default / Example             |
|-----------------------|-----------------------------------------|-------------------------------|
| `NAME`                | Instance name used in Traefik config    | `mmu`                         |
| `HOST`                | Public URL of the frontend              | `mmu.your-domain.com`         |
| `BACKEND_NAME`        | Internal name for the backend container | `mmu-backend`                 |
| `BACKEND_HOST`        | Public URL of the backend               | `mmu-backend.your-domain.com` |
| `CADDY_NAME`          | Internal name for the Caddy container   | `mmu-caddy`                   |
| `CADDY_HOST`          | Public URL of Caddy                     | `mmu-caddy.your-domain.com`   |
| `INSTANCE_SHORT_NAME` | Short name for display purposes         | `MMU`                         |
| `INSTANCE_NAME`       | Full instance name                      | `Mirador Multi User`          |

---

### 🔧 Backend Configuration

| Key                    | Description                                | Default / Example |
|------------------------|--------------------------------------------|-------------------|
| `LOG_LEVEL`            | 0=ERROR, 1=WARN, 2=DEBUG, 3=LOG, 4=VERBOSE | `0`               |
| `MAX_API_PAYLOAD_SIZE` | Max JSON payload size (in MB)              | `50`              |
| `SALT`                 | Bcrypt salt rounds for password hashing    | `10`              |
| `MAX_UPLOAD_SIZE`      | Max file upload size (in MB)               | `5`               |
| `ALLOW_CREATE_USER`    | Enable/disable account creation            | `true`            |
| `ALLOW_YOUTUBE_MEDIA`  | Allow adding YouTube videos as media       | `true`            |
| `ALLOW_PEERTUBE_MEDIA` | Allow adding PeerTube videos as media      | `true`            |

---

### 📧 SMTP Configuration (for email verification)

These are required for email-based account confirmation and password reset:

| Key               | Description                          | Example                 |
|-------------------|--------------------------------------|-------------------------|
| `SMTP_DOMAIN`     | SMTP server hostname                 | `smtp.mailprovider.com` |
| `SMTP_USER`       | SMTP username                        | `mmu@your-domain.fr`    |
| `SMTP_PASSWORD`   | SMTP password                        | `********`              |
| `SMTP_PORT`       | SMTP port (usually 587 or 465)       | `587`                   |
| `SMTP_IGNORE_TLS` | Set to `true` to skip TLS            | `false`                 |
| `SMTP_SSL`        | Set to `true` to use SSL             | `true`                  |
| `FROM_MAIL`       | Email used as the sender             | `mmu@your-domain.fr`    |
| `NAME_MAIL`       | Display name for sender emails       | `Mirador Multi User`    |
| `ADMIN_MAIL`      | Admin email to receive notifications | `mmu@your-domain.fr`    |

---

### 🔐 Authentication Modes

You can enable one or both:

| Key                      | Description                         | Values         |
|--------------------------|-------------------------------------|----------------|
| `OPENID_CONNECTION`      | Enable OpenID Connect login         | `true`/`false` |
| `CLASSIC_AUTHENTICATION` | Enable classic email/password login | `true`/`false` |

If using OpenID Connect, the following must also be set:

| Key                  | Description                            |
|----------------------|----------------------------------------|
| `OIDC_ISSUER`        | The URL of your OIDC identity provider |
| `OIDC_CLIENT_ID`     | OIDC client ID                         |
| `OIDC_CLIENT_SECRET` | OIDC client secret                     |
| `OIDC_REDIRECT_URI`  | The redirect URI for login callback    |
| `SESSION_SECRET`     | Used to secure sessions                |

---

### 🗃️ Database Configuration

| Key              | Description                         | Example        |
|------------------|-------------------------------------|----------------|
| `DB_USER`        | Database username                   | `mirador`      |
| `DB_PASS`        | Database password                   | `yourpassword` |
| `DB_DATABASE`    | Database name                       | `multiUsers`   |
| `DB_HOST`        | Hostname of the database container  | `db`           |
| `DB_EXPOSE_PORT` | Exposed DB port (for DBeaver, etc.) | `3306`         |

---

### 🌐 Caddy Server (Static File Hosting)

| Key                   | Description                                 | Default    |
|-----------------------|---------------------------------------------|------------|
| `HTTP_FOLDER`         | Path to public files served by Caddy        | `./upload` |
| `LOG_FOLDER`          | Path to Caddy logs                          | `./logs`   |
| `CADDY_PORT`          | Port used for Caddy (for local access only) | `9000`     |
| `CADDY_HTTP_PROTOCOL` | HTTP or HTTPS                               | `https`    |
| `CORS_ALLOWED_HOSTS`  | Whitelisted origins for static file access  | `*`        |

---

### 📊 Swagger (API Docs)

| Key                     | Description                       | Default                  |
|-------------------------|-----------------------------------|--------------------------|
| `SWAGGER_RELATIVE_PATH` | Path where Swagger UI is served   | `api`                    |
| `SWAGGER_TITLE`         | Title of the API docs             | `Mirador MultiUsers API` |
| `SWAGGER_DESCRIPTION`   | Description of the API docs       | `API Documentation...`   |
| `SWAGGER_VERSION`       | API version    external-dashboard | `0.1`                    |

---

### 📈 External 

| Key                      | Description                                |
|--------------------------|--------------------------------------------|
| `EXTERNAL_DASHBOARD_URL` | Optional link to external dashboards/tools |
| `ACCOUNT_MANAGEMENT_URL` | Optional link to account management page (e.g., password reset) |

