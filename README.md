# Mirador multi user

Mirador Multi user is a project that aims to create a multi-user environment for the Mirador 4 viewer.

# Demo

[https://mirador-multi-user.tetras-libre.fr/](https://mirador-multi-user.tetras-libre.fr/).
Contributions, issues report and feedback are welcomed.

If you want custom demo (like specific Mirador plugins or config) please contact us at
mirador-multi-user@tetras-libre.fr

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

In an other terminal, run following commands to generate the database

- `docker-compose exec backend npm run typeorm:generate-migration --name=db-init`
- `docker-compose exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts`

Now you can access :

- frontend to [http://localhost:4000](http://localhost:4000)
- backend to [http://localhost:3000](http://localhost:3000)
- backend API documentation to [http://localhost:3000/api](http://localhost:3000/api)
- Database to `http://localhost:3306` For DBeaver or other DB client
- Caddy to [http://localhost:9000](http://localhost:9000)

- ## Installation PROD (Docker)

- `git clone git@github.com:TETRAS-IIIF/mirador-multi-user.git`
- `cd mirador-multi-user`
- `cp .env.prod.sample .env`.

VERY IMPORTANT :

You must set the JWT_SECRET and the DB_PASSWORD in the .env file.

- `docker-compose up --build`

In an other terminal, run following commands to generate the database

- `docker-compose exec backend npm run typeorm:generate-migration --name=db-init`
- `docker-compose exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts`

## Wiki

https://github.com/TETRAS-IIIF/mirador-multi-user/wiki

## Maintainers

- Tetras Libre SARL (https://tetras-libre.fr)
- mirador-multi-user@tetras-libre.fr
