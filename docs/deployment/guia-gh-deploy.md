🚀 Guía de Configuración CI/CD para AEGG
Esta guía te ayudará a configurar GitHub Actions para que cuando hagas push a main (o merge de un PR), se despliegue automáticamente a tu servidor VPS con Plesk.

NOTE

Esta configuración está basada en el setup actual de ordo-todo, adaptado para AEGG con React (Vite) + NestJS + TypeORM.

📋 Requisitos Previos
✅ Repositorio en GitHub: tiagofur/aegg-new-app
✅ VPS Ubuntu con Plesk Obsidian (mismo servidor de ordo-todo)
✅ Docker instalado en el VPS
✅ Dominios configurados: aegg.creapolis.mx y aegg-api.creapolis.mx
Parte 1: Archivos en el Repositorio de AEGG
1.1. Crear Dockerfile para el Backend
Crea el archivo backend/Dockerfile:

# Backend Dockerfile - AEGG

FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package files

COPY backend/package\*.json ./

# Instalar dependencias

RUN npm ci

# Copiar código fuente

COPY backend/ .

# Build

RUN npm run build

# Production stage

FROM node:20-alpine AS production
WORKDIR /app

# Copiar node_modules y build

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package\*.json ./

# Usuario no-root para seguridad

RUN addgroup -g 1001 -S nodejs && \
 adduser -S nestjs -u 1001
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main.js"]
1.2. Crear Dockerfile para el Frontend
Crea el archivo frontend/Dockerfile:

# Frontend Dockerfile - AEGG (React + Vite)

FROM node:20-alpine AS builder
WORKDIR /app

# Build arguments

ARG VITE_API_URL

# Copiar package files

COPY frontend/package\*.json ./

# Instalar dependencias

RUN npm ci

# Copiar código fuente

COPY frontend/ .

# Configurar variable de entorno y build

ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# Production stage - Nginx para servir archivos estáticos

FROM nginx:alpine AS production

# Copiar configuración de nginx

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
1.3. Crear nginx.conf para el Frontend
Crea el archivo frontend/nginx.conf:

server {
listen 80;
server_name localhost;
root /usr/share/nginx/html;
index index.html; # Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; # Handle SPA routing
location / {
try_files $uri $uri/ /index.html;
    }
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
expires 1y;
add_header Cache-Control "public, immutable";
} # Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
1.4. Crear el GitHub Actions Workflow
Crea el archivo
.github/workflows/deploy.yml
:

# =============================================================================

# Deploy Workflow - AEGG

# Builds and deploys the application to production VPS

# =============================================================================

name: Deploy
on:
push:
branches: - main
paths-ignore: - '\*.md' - 'docs/\*\*'
workflow_dispatch:
inputs:
skip_tests:
description: 'Skip tests (emergency deploy)'
required: false
default: false
type: boolean
permissions:
contents: read
packages: write
env:
NODE_VERSION: '20'
REGISTRY: ghcr.io
BACKEND_IMAGE: ghcr.io/${{ github.repository_owner }}/aegg-backend
  FRONTEND_IMAGE: ghcr.io/${{ github.repository_owner }}/aegg-frontend
jobs:

# =============================================================================

# Build Backend Docker Image

# =============================================================================

build-backend:
name: Build Backend Image
runs-on: ubuntu-latest
outputs:
image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.BACKEND_IMAGE }}
          tags: |
            type=raw,value=${{ github.sha }}
type=raw,value=latest,enable={{is_default_branch}} - name: Build and push
uses: docker/build-push-action@v6
with:
context: .
file: backend/Dockerfile
push: true
tags: ${{ steps.meta.outputs.tags }}
labels: ${{ steps.meta.outputs.labels }}
cache-from: type=gha
cache-to: type=gha,mode=max

# =============================================================================

# Build Frontend Docker Image

# =============================================================================

build-frontend:
name: Build Frontend Image
runs-on: ubuntu-latest
outputs:
image_tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.FRONTEND_IMAGE }}
          tags: |
            type=raw,value=${{ github.sha }}
type=raw,value=latest,enable={{is_default_branch}} - name: Build and push
uses: docker/build-push-action@v6
with:
context: .
file: frontend/Dockerfile
push: true
tags: ${{ steps.meta.outputs.tags }}
labels: ${{ steps.meta.outputs.labels }}
build-args: |
VITE_API_URL=https://aegg-api.creapolis.mx
cache-from: type=gha
cache-to: type=gha,mode=max

# =============================================================================

# Deploy to Production

# =============================================================================

deploy:
name: Deploy to Production
runs-on: ubuntu-latest
needs: [build-backend, build-frontend]
if: always() && needs.build-backend.result == 'success' && needs.build-frontend.result == 'success'
environment: production
steps: - name: Deploy via SSH
uses: appleboy/ssh-action@v1.0.3
env:
IMAGE_TAG: ${{ github.sha }}
GITHUB_USER: ${{ github.actor }}
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
with:
host: ${{ secrets.VPS_HOST }}
username: ${{ secrets.VPS_USER }}
key: ${{ secrets.VPS_SSH_KEY }}
port: ${{ secrets.VPS_SSH_PORT }}
envs: IMAGE_TAG,GITHUB_USER,GITHUB_TOKEN
script: |
set -euo pipefail

            cd /opt/aegg

            echo "[$(date)] 🚀 Starting AEGG deployment..."

            # Export variables for docker-compose
            export IMAGE_TAG=$IMAGE_TAG
            export GITHUB_USER=$GITHUB_USER
            export GITHUB_TOKEN=$GITHUB_TOKEN

            # Login to GitHub Container Registry
            echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_USER" --password-stdin

            # Stop existing containers
            echo "[$(date)] 🛑 Stopping existing containers..."
            docker compose down --remove-orphans || true

            # Pull new images
            echo "[$(date)] 📦 Pulling new images..."
            docker compose pull

            # Run database migrations (if using TypeORM migrations)
            echo "[$(date)] 🗄️ Running database migrations..."
            docker compose up -d postgres
            sleep 5
            docker compose run --rm backend npm run migration:run || true

            # Deploy services
            echo "[$(date)] 🔄 Deploying services..."
            docker compose up -d

            # Wait for health checks
            echo "[$(date)] ⏳ Waiting for services to be healthy..."
            sleep 20

            # Verify deployment
            echo "[$(date)] ✅ Verifying deployment..."
            docker compose ps

            # Cleanup old images
            echo "[$(date)] 🧹 Cleaning up..."
            docker image prune -af --filter "until=168h" || true

            echo "[$(date)] ✅ AEGG deployment completed successfully!"
      - name: Notify on Success
        if: success()
        run: |
          echo "✅ AEGG Deployment successful!"
          echo "Frontend: https://aegg.creapolis.mx"
          echo "Backend: https://aegg-api.creapolis.mx"
      - name: Notify on Failure
        if: failure()
        run: |
          echo "❌ AEGG Deployment failed!"
          echo "Check the logs above for details."

Parte 2: Configuración en GitHub
2.1. Configurar Secrets del Repositorio
Ve a tu repositorio en GitHub → Settings → Secrets and variables → Actions → New repository secret

Secret Name Valor
VPS_HOST IP del servidor (ej: 74.208.234.244)
VPS_USER Usuario SSH (ej: root)
VPS_SSH_KEY Tu clave SSH privada completa (incluyendo -----BEGIN...)
VPS_SSH_PORT Puerto SSH (normalmente 22)
IMPORTANT

Los secrets VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_SSH_PORT pueden ser los mismos que usas para ordo-todo ya que es el mismo servidor.

2.2. Crear Environment de Production
Ve a Settings → Environments
Click en New environment
Nombre: production
(Opcional) Añade protección de revisión si quieres aprobar deploys manualmente
Parte 3: Configuración en el VPS
3.1. Crear el Directorio de la Aplicación
Conéctate por SSH a tu VPS y ejecuta:

# Crear directorio para AEGG

sudo mkdir -p /opt/aegg
cd /opt/aegg

# Crear directorio para backups de PostgreSQL

mkdir -p backups
3.2. Crear el docker-compose.yml
Crea el archivo /opt/aegg/docker-compose.yml:

# =============================================================================

# Docker Compose for AEGG - Plesk Deployment

# =============================================================================

services:

# =============================================================================

# PostgreSQL Database

# =============================================================================

postgres:
image: postgres:16-alpine
container_name: aegg-postgres
restart: unless-stopped
environment:
POSTGRES_USER: ${POSTGRES_USER}
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
POSTGRES_DB: ${POSTGRES_DB}
volumes: - aegg_postgres_data:/var/lib/postgresql/data - ./backups:/backups
ports: - "127.0.0.1:5433:5432" # Puerto diferente para no chocar con ordo-todo
healthcheck:
test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
interval: 10s
timeout: 5s
retries: 5

# =============================================================================

# Backend (NestJS API)

# =============================================================================

backend:
image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/aegg-backend:${IMAGE_TAG:-latest}
container_name: aegg-backend
restart: unless-stopped
depends_on:
postgres:
condition: service_healthy
environment:
NODE_ENV: production
PORT: 3000
DB_HOST: postgres
DB_PORT: 5452
DB_USERNAME: eagg_user
DB_PASSWORD: 2v8Qw3n6XyZp4s7Lr9Jk1b5T
DB_DATABASE: eaggdb
JWT_SECRET: Qw8n2vXyZp4s7Lr9Jk1b5T6uYh3Gf5Sd8Qw2Lp9Jk1b5T6uYh3Gf5Sd8Qw2Lp9Jk
CORS_ORIGINS: https://aegg.creapolis.mx,https://aegg-api.creapolis.mx
ports: - "127.0.0.1:3003:3000" # Puerto interno para Plesk
healthcheck:
test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
interval: 30s
timeout: 10s
retries: 3
start_period: 40s

# =============================================================================

# Frontend (React + Vite)

# =============================================================================

frontend:
image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/aegg-frontend:${IMAGE_TAG:-latest}
container_name: aegg-frontend
restart: unless-stopped
depends_on: - backend
ports: - "127.0.0.1:3004:80" # Puerto interno para Plesk
healthcheck:
test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80"]
interval: 30s
timeout: 10s
retries: 3
start_period: 10s
volumes:
aegg_postgres_data:
driver: local
WARNING

Los puertos 5433, 3003 y 3004 deben ser diferentes a los de ordo-todo para evitar conflictos.

ordo-todo usa: 5432, 3001, 3000
AEGG usará: 5433, 3003, 3004
3.3. Crear el archivo .env
Crea el archivo /opt/aegg/.env:

# GitHub

GITHUB_REPOSITORY_OWNER=tiagofur
IMAGE_TAG=latest

# PostgreSQL

POSTGRES_USER=eagg_user
POSTGRES_PASSWORD=2v8Qw3n6XyZp4s7Lr9Jk1b5T
POSTGRES_DB=eaggdb

# JWT

JWT_SECRET=Qw8n2vXyZp4s7Lr9Jk1b5T6uYh3Gf5Sd8Qw2Lp9Jk1b5T6uYh3Gf5Sd8Qw2Lp9Jk
Asegura los permisos:

chmod 600 /opt/aegg/.env
Parte 4: Configuración de Plesk
4.1. Configurar Dominio del Frontend (aegg.creapolis.mx)
En Plesk, ve al dominio aegg.creapolis.mx
Apache & nginx Settings → Additional nginx directives:
location / {
proxy_pass http://127.0.0.1:3004;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
}
Activa Let's Encrypt para SSL
4.2. Configurar Dominio del Backend (aegg-api.creapolis.mx)
En Plesk, ve al dominio aegg-api.creapolis.mx
Apache & nginx Settings → Additional nginx directives:
location / {
proxy_pass http://127.0.0.1:3003;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

    # Para subida de archivos grandes
    client_max_body_size 50M;

    # CORS headers (opcional, el backend ya los maneja)
    # add_header Access-Control-Allow-Origin "https://aegg.creapolis.mx" always;

}
Activa Let's Encrypt para SSL
Parte 5: Primer Deploy Manual (Una sola vez)
Después de configurar todo, haz el primer deploy manualmente:

# En el VPS

cd /opt/aegg

# Cargar variables de entorno

source .env

# Login a GHCR (usa tu token de GitHub con permisos de packages:read)

echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u tiagofur --password-stdin

# Levantar servicios

docker compose up -d

# Verificar

docker compose ps
docker compose logs -f
📊 Resumen de Puertos
Servicio Ordo-Todo AEGG
PostgreSQL 5432 5433
Backend 3001 3003
Frontend/Web 3000 3004
🔄 Flujo de Deploy
Push a main
GitHub Actions
Build Backend Image
Build Frontend Image
Push a GHCR
SSH al VPS
docker compose pull
docker compose up -d
✅ Deploy completo
🐛 Troubleshooting
Los containers no inician
cd /opt/aegg
docker compose logs backend
docker compose logs frontend
Error de permisos de GHCR

# Re-login

echo "TU_GITHUB_TOKEN" | docker login ghcr.io -u tiagofur --password-stdin
Puerto ocupado

# Ver qué usa el puerto

sudo lsof -i :3003

# O forzar el stop

sudo fuser -k 3003/tcp
Reiniciar todo
cd /opt/aegg
docker compose down
docker compose up -d
✅ Checklist Final
Crear backend/Dockerfile en el repo
Crear frontend/Dockerfile en el repo
Crear frontend/nginx.conf en el repo
Crear
.github/workflows/deploy.yml
en el repo
Configurar secrets en GitHub
Crear environment production en GitHub
Crear /opt/aegg/ en el VPS
Crear
docker-compose.yml
en el VPS
Crear .env en el VPS
Configurar nginx en Plesk para ambos dominios
Activar SSL con Let's Encrypt
Hacer primer push a main y verificar deployment
¿Dudas? Revisa los logs con:

# En GitHub: Actions tab del repositorio

# En el VPS:

cd /opt/aegg && docker compose logs -f
