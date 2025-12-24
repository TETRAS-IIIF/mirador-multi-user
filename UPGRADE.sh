#!/bin/bash
# voir README pour plus d'informations

## Create a new migration file with the changes made to the entities
docker-compose exec backend npm run typeorm:generate-migration --name=db-update-$(date +%Y%m%d%H%M%S)

## Run the migration to update the database schema
docker-compose exec backend npm run typeorm migration:run -- -d ./src/config/dataSource.ts
