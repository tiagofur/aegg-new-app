#!/bin/sh
# Database Backup Script for AEGG Application

set -e

# Variables from environment
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/aegg_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

echo "🗄️  Starting database backup..."

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Perform backup
pg_dump -h ${POSTGRES_HOST} \
        -U ${POSTGRES_USER} \
        -d ${POSTGRES_DB} \
        --no-password \
        --format=plain \
        --no-owner \
        --no-acl > ${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}
echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Clean old backups
echo "🧹 Cleaning backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "aegg_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "✅ Backup completed successfully"
