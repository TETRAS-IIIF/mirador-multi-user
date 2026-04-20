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

You will eventually get errors related to the database (table settings not existing for example) but it will be fixed in the next step

In another terminal, run following commands to generate the database

- `./cli.sh migration create init `
- `./cli.sh migration run`

Now you can access (all ports can be customized in the .env file) :

- frontend to [http://localhost:4000](http://localhost:4000)
- backend to [http://localhost:3000/api](http://localhost:3000/api)
- Database to `http://localhost:3306` For DBeaver or other DB client
- Caddy to [http://localhost:9000](http://localhost:9000)

## Installation PROD (Docker + Traefik as an application proxy on your server)

1. `git clone git@github.com:TETRAS-IIIF/mirador-multi-user.git`
2. `cd mirador-multi-user`
3. `cp .env.prod.sample .env`.
4. Set the required environment variables in the `.env` file. See [ENVIRONMENT.md](ENVIRONMENT.md) for a complete list of environment variables and their descriptions.


5. `docker-compose up --build`

You will eventually get errors related to the database (table settings not existing for example) but it will be fixed in the next step

In another terminal, run following commands to generate the database

6. `./cli.sh migration create init `
7. `./cli.sh migration run`

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
