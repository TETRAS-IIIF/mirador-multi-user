# Mirador multi user

# Table of Contents

- [Mirador Multi User](#mirador-multi-user)
    - [Demo](#demo)
    - [Features](#features)
    - [Installation](#installation)
        - [Installation DEV (Docker)](#installation-dev-docker)
        - [Installation PROD (Docker)](#installation-prod-docker)
            - [Required Environment Variables](#-required-environment-variables)
            - [Core Application Settings](#️-core-application-settings)
            - [Backend Configuration](#-backend-configuration)
            - [SMTP Configuration](#-smtp-configuration)
            - [Authentication Modes](#-authentication-modes)
            - [Database Configuration](#️-database-configuration)
            - [Caddy Server (Static File Hosting)](#-caddy-server-static-file-hosting)
            - [Swagger (API Docs)](#-swagger-api-docs)
            - [Logs](#-logs)
            - [External Dashboard](#-external-dashboard)
            - [Check if all your service are up](#-Check-if-you're-installation-is-ready-to-use-:)
    - [Documentation](#documentation)
        - [Wiki](#wiki)
        - [Roadmap](#Roadmap)
        - [Changelog](#changelog)
    - [Contributing](#contributing)
        - [CLI Tool helper (experimental)](#cli-tool-helper-experimental)
    - [Maintainers](#maintainers)

Mirador Multi user is a project that aims to create a multi-user environment for the Mirador 4 viewer.
Forked from original work of https://github.com/ARVEST-APP/mirador-multi-user

Main additions at (2025-06-05) :

| Features                                | Use cases                                                                                         |
|-----------------------------------------|---------------------------------------------------------------------------------------------------|
| All files type management               | Manage your media collection with any files. Before, it was only supporting image and video file. |
| Advanced project snapshot management    | Create, edit and share snapshots of your Mirador projects                                         |
| Configure tags and templates by project | Configure text templates and available tags in your IIIF annotations                              |
| Advanced admin page                     | Manage seamlessly MMU instance from admin page                                                    |

# Demo

[https://app.mirador-multi-user.com/](https://app.mirador-multi-user.com/).
Contributions, issues report and feedback are welcomed.

If you want custom demo (like specific Mirador plugins or config) please contact us at
mirador-multi-user@tetras-libre.fr

# Presentation website

[https://www.mirador-multi-user.com/](https://www.mirador-multi-user.com/).

# Features

- Multi-user environment
- User management
- Media management
- Collection management

# Installation

## Installation DEV (Docker)

- `git clone git@github.com:TETRAS-IIIF/mirador-multi-user.git`
- `cd mirador-multi-user`
- `cp .env.dev.sample .env`
- `nvm use`
- `cd backend`
- `npm install`
- `cd ../frontend`
- `npm install`
- `cd ..`
- `docker-compose up --build`

In another terminal, run following commands to generate the database

- `docker-compose exec backend npm run typeorm:generate-migration --name=db-init`
- `docker-compose exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts`

Now you can access :

- frontend to [http://localhost:4000](http://localhost:4000)
- backend to [http://localhost:3000](http://localhost:3000)
- backend API documentation to [http://localhost:3000/api](http://localhost:3000/api)
- Database to `http://localhost:3306` For DBeaver or other DB client
- Caddy to [http://localhost:9000](http://localhost:9000)

## Installation PROD (Docker)

1. `git clone git@github.com:TETRAS-IIIF/mirador-multi-user.git`
2. `cd mirador-multi-user`
3. `cp .env.prod.sample .env`.
4. You must set the env variables listed bellow :

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

### 📈 External Dashboard

| Key                      | Description                                |
|--------------------------|--------------------------------------------|
| `EXTERNAL_DASHBOARD_URL` | Optional link to external dashboards/tools |

5. `docker-compose up --build`

In an other terminal, run following commands to generate the database

6. `docker-compose exec backend npm run typeorm:generate-migration --name=db-init`
7. `docker-compose exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts`

### Check if you're installation is ready to use :

See wiki page there : https://github.com/TETRAS-IIIF/mirador-multi-user/wiki/Admin-manual#post-deployment-checks

# Logs

Mirador Multi User provides logging for both the backend and Caddy server.

## Backend Logs

Backend logs are printed to the container output and can be configured via environment variables:

| Key         | Description                                                | Values     |
|-------------|------------------------------------------------------------|------------|
| `LOG_LEVEL` | Log verbosity (0=ERROR, 1=WARN, 2=DEBUG, 3=LOG, 4=VERBOSE) | `0` to `4` |

To view logs:

```bash
docker-compose logs -f backend
```

For production environments, logs can also be redirected to a file or managed by external logging solutions (e.g.,
journald, ELK stack).

## Caddy Logs

Caddy logs are stored in the directory specified by the LOG_FOLDER environment variable:

| Key          | Description                     | Values |
|--------------|---------------------------------|--------|
| `LOG_FOLDER` | Path to Caddy access/error logs | ./logs |

To access logs:

```bash
tail -f ./logs/access.log
tail -f ./logs/error.log
```

You can customize Caddy logging further by editing the Caddyfile in the root project.

# Testing

Mirador Multi User utilise :

- [Playwright](https://playwright.dev/) pour les tests end-to-end (E2E)
- [Vitest](https://vitest.dev/) pour les tests unitaires et d'intégration

### Commandes disponibles

#### Tests Unitaires (Vitest)

| Commande             | Description                                                              |
|----------------------|--------------------------------------------------------------------------|
| `npm test`           | Exécute les tests unitaires avec Vitest (mode watch)                     |
| `npm run test:ci`    | Exécute les tests unitaires avec couverture de code (mode CI)            |
| `npm run test:watch` | Exécute les tests unitaires en mode watch (rafraîchissement automatique) |

#### Tests End-to-End (Playwright)

| Commande                 | Description                                                             |
|--------------------------|-------------------------------------------------------------------------|
| `npm run test:e2e`       | Exécute les tests E2E en mode **light** (Firefox uniquement)            |
| `npm run test:e2e:full`  | Exécute les tests E2E en mode **full** (Chromium, Firefox, WebKit)      |
| `npm run test:e2e:ci`    | Exécute les tests E2E optimisés pour la CI (mode light par défaut)      |
| `npm run test:e2e:ui`    | Lance l'interface graphique Playwright pour exécuter/déboguer les tests |
| `npm run test:report`    | Ouvre le rapport HTML des tests E2E dans le navigateur                  |
| `npm run test:e2e:debug` | Exécute les tests E2E en mode debug (avec interface graphique)          |
| `npm run test:e2e:trace` | Exécute les tests E2E avec traçage activé (pour analyse approfondie)    |

# Maintainers

- Tetras Libre SARL (https://tetras-libre.fr), french company specialized in free software and open source.
- mirador-multi-user@tetras-libre.fr
