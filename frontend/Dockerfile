# Base image
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Define build arguments
ARG VITE_CADDY_URL
ARG VITE_BACKEND_URL
ARG VITE_INSTANCE_SHORT_NAME
ARG VITE_INSTANCE_NAME
ARG VITE_MAX_UPLOAD_SIZE
ARG VITE_OIDC_ISSUER
ARG VITE_OIDC_CLIENT_ID

# Echo the build arguments and set environment variables in the same step
RUN echo "VITE_BACKEND_URL: $VITE_BACKEND_URL" && \
    echo "VITE_CADDY_URL: $VITE_CADDY_URL" && \
    echo "VITE_INSTANCE_SHORT_NAME: $VITE_INSTANCE_SHORT_NAME" && \
    echo "VITE_INSTANCE_NAME: $VITE_INSTANCE_NAME" && \
    echo "VITE_MAX_UPLOAD_SIZE: $VITE_MAX_UPLOAD_SIZE" && \
    echo "VITE_OIDC_CLIENT_ID: $VITE_OIDC_CLIENT_ID" && \
    echo "VITE_OIDC_ISSUER: $VITE_OIDC_ISSUER" && \
    export VITE_BACKEND_URL=$VITE_BACKEND_URL && \
    export VITE_CADDY_URL=$VITE_CADDY_URL && \
    export VITE_INSTANCE_SHORT_NAME=$VITE_INSTANCE_SHORT_NAME && \
    export VITE_INSTANCE_NAME=$VITE_INSTANCE_NAME \
    export VITE_MAX_UPLOAD_SIZE=$VITE_MAX_UPLOAD_SIZE \
    export VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID \
    export VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
# Set the environment variables for future steps
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_CADDY_URL=$VITE_CADDY_URL
ENV VITE_INSTANCE_SHORT_NAME=$VITE_INSTANCE_SHORT_NAME
ENV VITE_INSTANCE_NAME=$VITE_INSTANCE_NAME
ENV VITE_MAX_UPLOAD_SIZE=$VITE_MAX_UPLOAD_SIZE
ENV VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
# Copy application code (excluding what's defined in .dockerignore)
COPY . .

# Install serve to render index.html in ENV=PROD
RUN npm install --global serve

# Build the application
RUN npm run build

EXPOSE 4000

# Command to run the application
ENTRYPOINT ["sh","/app/entrypoint.sh"]
