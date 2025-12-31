#!/bin/bash
set -e

# Configuration
export COMPOSE_PROJECT_NAME=aegg
DEPLOY_DIR="/opt/aegg"
BACKUP_DIR="/opt/aegg-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Deployment for $COMPOSE_PROJECT_NAME${NC}"

# Ensure directories exist
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"
cd "$DEPLOY_DIR"

# 1. Update Permissions
if [ -f "docker-compose.prod.yml" ]; then
    chmod 644 docker-compose.prod.yml
fi

# 2. Check/Create External Volume (Crucial for Data Persistence)
echo -e "${YELLOW}💾 Checking database volume...${NC}"
if ! docker volume ls --quiet | grep -q "^aegg_postgres_data$"; then
    echo -e "${YELLOW}⚠️  Volume aegg_postgres_data does not exist. Creating it now...${NC}"
    docker volume create aegg_postgres_data
    echo -e "${GREEN}✅ Volume aegg_postgres_data created.${NC}"
else
    echo -e "${GREEN}✅ Volume aegg_postgres_data exists.${NC}"
fi

# 3. Pull Images with Retry Logic
echo -e "${YELLOW}🔐 Logging in to GitHub Container Registry...${NC}"
if [ -n "$GITHUB_TOKEN" ] && [ -n "$GITHUB_ACTOR" ]; then
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
else
    echo -e "${RED}⚠️  GITHUB_TOKEN or GITHUB_ACTOR not set. Skipping login (might fail if image is private).${NC}"
fi

echo -e "${YELLOW}⬇️  Pulling images...${NC}"
pull_with_retry() {
    local image=$1
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts: Pulling $image..."
        if timeout 300 docker pull "$image"; then
            echo -e "${GREEN}✅ Pulled $image${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Failed to pull $image (attempt $attempt)${NC}"
            if [ $attempt -lt $max_attempts ]; then
                sleep 10
            fi
        fi
        attempt=$((attempt + 1))
    done
    echo -e "${RED}❌ Failed to pull $image${NC}"
    return 1
}

if [ -n "$GITHUB_REPOSITORY" ]; then
    pull_with_retry "ghcr.io/$GITHUB_REPOSITORY/aegg-backend:latest"
    pull_with_retry "ghcr.io/$GITHUB_REPOSITORY/aegg-frontend:latest"
else
    echo -e "${RED}❌ GITHUB_REPOSITORY environment variable not set${NC}"
    exit 1
fi

# 4. Backup Database (if possible)
echo -e "${YELLOW}📦 Creating database backup...${NC}"
# Check if postgres container is running
if docker ps --format '{{.Names}}' | grep -q "^aegg-postgres$"; then
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/backup_$TIMESTAMP.sql"; then
        echo -e "${GREEN}✅ Backup created at $BACKUP_DIR/backup_$TIMESTAMP.sql${NC}"
    else
        echo -e "${RED}⚠️  Backup failed! Proceeding carefully.${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Postgres container not running. Skipping backup.${NC}"
fi

# 5. Restart Services
echo -e "${YELLOW}🔄 Restarting application services...${NC}"

# Fix for "KeyError: 'ContainerConfig'" by forcefully removing old containers
# We stop everything first to ensure a clean state, especially given the history of issues
echo -e "${YELLOW}🛑 Stopping all services...${NC}"
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

echo -e "${YELLOW}🚀 Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# 6. Run Migrations
echo -e "${YELLOW}🏗️  Running migrations...${NC}"
if docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run; then
    echo -e "${GREEN}✅ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migrations failed! Check logs.${NC}"
    # Not exiting here to allow seeing logs, but flagging error
fi

# 7. Cleanup
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -af --filter "until=72h"

# 8. Status
echo -e "${GREEN}✅ Deployment Complete!${NC}"
docker-compose -f docker-compose.prod.yml ps
