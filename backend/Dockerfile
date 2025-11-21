# Base image
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
COPY ./src ./src

RUN npm ci

# Copy remaining application code (ensure entrypoint.sh is executable)
COPY . .

# Build the application if necessary
RUN npm run build

EXPOSE 3000

# Set the entry point
ENTRYPOINT ["sh","/app/entrypoint.sh"]
