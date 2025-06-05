# Mirador multi user

Mirador Multi user is a project that aims to create a multi-user environment for the Mirador 4 viewer.
Forked from original work of https://github.com/ARVEST-APP/mirador-multi-user

Main additions at (2025-06-05) :
| Features | Use cases |
|-----------------------------------------|---------------------------------------------------------------------------------------------------------------|
| All files type management | Manage your media collection with any file type like PDF. Before it was only supporting
image and video file. |
| Advanced project snapshot management | Create, edit and share snapshots of your Mirador projects |
| Configure tags and templates by project | Configure text templates and available tags in your IIIF annotations |
| Advanced admin page | Manage seamlessly MMU instance from admin page

- Advanced project snapshots management. You can create and share your projects

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

In another terminal, run following commands to generate the database

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

# Documentation

## Wiki

https://github.com/TETRAS-IIIF/mirador-multi-user/wiki

## Changelog

Check the [CHANGELOG.md](CHANGELOG.md) file for the latest changes.

Changelog can be updated automatically by running the command `./cli.sh changelog`.
The command generates a new changelog entry based on the latest git commits. It's possible to rewrite message or
grouping commit on same line (keep parenthesis around commit revision ID).

## Contributing

# CLI Tool helper (experimental)

You can use the CLI tool to help you with some tasks. The CLI tool is located in the `cli.sh` file.
To see the available commands, run:

```bash
./cli.sh help
```

The CLI Tools are always experimental and has not been tested extensively. Use at your own risk.

# Maintainers

- Tetras Libre SARL (https://tetras-libre.fr), french company specialized in free software and open source.
- mirador-multi-user@tetras-libre.fr
