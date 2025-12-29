# AEGG Application - VPS Deployment Guide

Complete guide for deploying the AEGG application to a VPS, based on the ordo-todo CI/CD strategy.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [GitHub Configuration](#github-configuration)
4. [Deployment](#deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required:

- **VPS**: Ubuntu 20.04+ or Debian 11+ server with at least:
  - 2GB RAM (4GB recommended)
  - 20GB SSD storage
  - 1 CPU core (2+ recommended)
- **Domain**: `aegg.creapolis.mx` and `aegg-api.creapolis.mx`
- **GitHub Repository**: Pushed to GitHub with Actions enabled
- **Docker Hub** or **GitHub Container Registry** account

### Local Machine:

- Git installed
- SSH client
- Text editor

---

## VPS Setup

### Step 1: Initial Server Access

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y
```

### Step 2: Run Automated Setup Script

The setup script automates the entire VPS configuration:

```bash
# On your VPS
cd /opt
git clone https://github.com/YOUR_USERNAME/aegg-new-app.git
cd aegg-new-app/deploy/scripts

# Make script executable
chmod +x setup-vps.sh

# Run setup (requires root)
sudo ./setup-vps.sh
```

**What this script does:**
- ✅ Updates system packages
- ✅ Installs Docker & Docker Compose
- ✅ Creates deploy user (`aegg`)
- ✅ Configures firewall (UFW)
- ✅ Configures Fail2Ban
- ✅ Creates deployment directories
- ✅ Sets up automatic backups
- ✅ Enables automatic security updates

### Step 3: Generate Secrets

```bash
# On your local machine
cd aegg-new-app/deploy/scripts
chmod +x generate-secrets.sh
./generate-secrets.sh
```

**This will generate:**
- Database password
- JWT secret
- Traefik dashboard password

**IMPORTANT:** Save these credentials securely!

### Step 4: Configure Environment Variables

```bash
# On VPS, copy the generated .env file
sudo mkdir -p /opt/aegg
sudo nano /opt/aegg/.env
```

Paste the generated secrets and update:

```env
# Database Configuration
DB_NAME=aegg_db
DB_USER=aegg_user
DB_PASSWORD=generated_password_here
DB_HOST=postgres
DB_PORT=5432

# JWT Configuration
JWT_SECRET=generated_jwt_secret_here
JWT_EXPIRATION=7d

# Application URLs
API_URL=https://aegg-api.creapolis.mx
FRONTEND_URL=https://aegg.creapolis.mx

# Let's Encrypt
LETSENCRYPT_EMAIL=your-email@example.com

# Traefik Dashboard Auth
TRAEFIK_BASIC_AUTH=admin:generated_hash_here

# GitHub Container Registry
GITHUB_REPOSITORY=YOUR_USERNAME/aegg-new-app
GITHUB_REPOSITORY_OWNER=YOUR_USERNAME

# Backup Configuration
BACKUP_RETENTION_DAYS=7
```

### Step 5: Configure DNS

Add the following DNS records at your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | aegg | Your VPS IP | 3600 |
| A | aegg-api | Your VPS IP | 3600 |
| A | traefik | Your VPS IP | 3600 |

### Step 6: Setup SSL with Traefik

Traefik will automatically obtain Let's Encrypt SSL certificates. Make sure:

1. Ports 80 and 443 are open in your firewall
2. DNS records are propagated (can take up to 24 hours)
3. The `LETSENCRYPT_EMAIL` is correct in your `.env`

---

## GitHub Configuration

### Step 1: Configure GitHub Secrets

Go to your repository: **Settings → Secrets and variables → Actions**

Add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | VPS IP address or domain | `123.45.67.89` |
| `VPS_USER` | SSH username (deploy user) | `aegg` |
| `VPS_PORT` | SSH port | `22` |
| `VPS_SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `GITHUB_TOKEN` | GitHub PAT (auto-generated) | N/A |
| `API_URL` | Backend API URL | `https://aegg-api.creapolis.mx` |
| `DB_HOST` | Database host | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `DB_USER` | Database user | `aegg_user` |
| `DB_PASSWORD` | Database password | `generated_password` |
| `DB_NAME` | Database name | `aegg_db` |
| `JWT_SECRET` | JWT secret | `generated_secret` |

### Step 2: Generate SSH Key Pair

**On your local machine:**

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/aegg_deploy

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/aegg_deploy.pub aegg@your-vps-ip

# Copy private key to GitHub clipboard
cat ~/.ssh/aegg_deploy | pbcopy  # macOS
cat ~/.ssh/aegg_deploy | xclip   # Linux
```

**Add to GitHub:**
1. Go to repository Settings → Secrets
2. Create new secret: `VPS_SSH_KEY`
3. Paste the **private key** (including `-----BEGIN` and `-----END` lines)

### Step 3: Enable GitHub Actions

1. Go to repository **Settings → Actions → General**
2. Under "Actions permissions", select:
   - ✅ "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

### Step 4: Configure Container Registry Access

GitHub Actions can push to GHCR automatically using the built-in `GITHUB_TOKEN`.

**No additional configuration needed!**

---

## Deployment

### Option 1: Automatic Deployment (Recommended)

When you push to `main` branch, GitHub Actions will:

1. ✅ Run tests (backend + frontend)
2. ✅ Build Docker images
3. ✅ Push to GitHub Container Registry
4. ✅ Deploy to VPS via SSH
5. ✅ Run database migrations
6. ✅ Restart services

**To deploy:**

```bash
# Just push to main branch
git checkout main
git merge your-feature-branch
git push origin main
```

**Monitor deployment:**

Go to: **Actions** tab in your GitHub repository

### Option 2: Manual Deployment

#### Method A: Via GitHub Actions UI

1. Go to **Actions** tab
2. Select "🚀 Deploy to Production (VPS)" workflow
3. Click "Run workflow"
4. Select `main` branch
5. Click "Run workflow"

#### Method B: Via SSH

```bash
# SSH into VPS
ssh aegg@your-vps-ip

# Navigate to deployment directory
cd /opt/aegg

# Pull latest code
git pull origin main

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull new images
docker-compose -f docker-compose.prod.yml pull

# Restart services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run
```

### Option 3: Using Deploy Script

```bash
# On VPS
cd /opt/aegg/scripts

# Run deploy script
./deploy.sh
```

---

## Monitoring & Maintenance

### Check Service Status

```bash
# All services
docker-compose -f /opt/aegg/docker-compose.prod.yml ps

# Backend logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f backend

# Frontend logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f frontend

# Database logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f postgres

# Traefik logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f traefik
```

### Access Traefik Dashboard

1. Add DNS record: `traefik.aegg.creapolis.mx` → VPS IP
2. Access: `https://traefik.aegg.creapolis.mx`
3. Login with credentials from `.env` (`TRAEFIK_BASIC_AUTH`)

### Database Backups

**Automatic backups:**
- Runs daily at 2 AM
- Stored in `/opt/aegg-backups/`
- Keeps last 7 days

**Manual backup:**

```bash
cd /opt/aegg
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U aegg_user aegg_db > backup_$(date +%Y%m%d).sql
```

**Restore backup:**

```bash
docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T postgres \
    psql -U aegg_user aegg_db < backup_20231228.sql
```

### System Monitoring

**Disk usage:**

```bash
df -h
docker system df
```

**Clean Docker resources:**

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (⚠️ careful!)
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

**Log rotation (already configured):**

Logs are automatically rotated. Check configuration:

```bash
# View log configuration
docker inspect aegg-backend | grep -A 10 LogConfig
```

---

## Troubleshooting

### Issue: Deployment fails

**Check:**

```bash
# View GitHub Actions logs
# Go to Actions tab → Click on failed workflow → View logs

# Check VPS SSH access
ssh aegg@your-vps-ip

# Check Docker is running
docker ps
```

### Issue: Containers not starting

```bash
# Check logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs

# Restart specific service
docker-compose -f /opt/aegg/docker-compose.prod.yml restart backend

# Restart all services
docker-compose -f /opt/aegg/docker-compose.prod.yml restart
```

### Issue: SSL Certificate not obtained

**Check:**

1. DNS records are correct and propagated
2. Ports 80 and 443 are open
3. Traefik logs:

```bash
docker-compose -f /opt/aegg/docker-compose.prod.yml logs traefik
```

**Force certificate renewal:**

```bash
# Delete acme.json
rm /opt/aegg/traefik_letsencrypt/acme.json

# Restart traefik
docker-compose -f /opt/aegg/docker-compose.prod.yml restart traefik
```

### Issue: Database connection failed

```bash
# Check database is running
docker-compose -f /opt/aegg/docker-compose.prod.yml ps postgres

# Check database logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs postgres

# Test connection from backend container
docker-compose -f /opt/aegg/docker-compose.prod.yml exec backend \
    nc -zv postgres 5432
```

### Issue: High memory usage

```bash
# Check container stats
docker stats

# Limit container memory in docker-compose.prod.yml:
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Emergency Rollback

```bash
# SSH into VPS
ssh aegg@your-vps-ip

# View previous images
docker images | grep aegg

# Restart with previous image
docker-compose -f /opt/aegg/docker-compose.prod.yml up -d \
    --image ghcr.io/YOUR_USERNAME/aegg-backend:previous_tag
```

---

## Security Best Practices

### 1. Regular Updates

```bash
# On VPS, run monthly
sudo apt update && sudo apt upgrade -y
```

### 2. Monitor Failed Login Attempts

```bash
# Check Fail2Ban logs
sudo fail2ban-client status sshd

# Unban an IP (if needed)
sudo fail2ban-client set sshd unbanip IP_ADDRESS
```

### 3. Rotate Secrets Regularly

```bash
# Generate new secrets
cd deploy/scripts
./generate-secrets.sh

# Update .env on VPS
sudo nano /opt/aegg/.env

# Restart services
cd /opt/aegg
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Backup Critical Data

```bash
# Backup script location
ls -lh /opt/aegg-backups/

# Copy backups to remote location
scp aegg@vps:/opt/aegg-backups/backup_*.sql.gz /local/backup/path/
```

### 5. Monitor Disk Space

```bash
# Add to crontab for alerts
crontab -e

# Add: Check disk space daily at 9 AM
0 9 * * * df -h | grep -E "9[0-9]%" | mail -s "Disk space alert" admin@example.com
```

---

## Performance Optimization

### 1. Enable Docker BuildKit

Already configured in GitHub Actions.

### 2. Use Multi-Stage Builds

Already configured in Dockerfiles.

### 3. Configure Nginx Caching

Edit `frontend/nginx.conf` on the VPS:

```nginx
# Add to http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g
                 inactive=60m use_temp_path=off;

# Add to location block
proxy_cache my_cache;
proxy_cache_valid 200 60m;
```

### 4. Database Indexing

Check your TypeORM entities have proper indexes:

```typescript
@Index(['columnName'])
@Entity()
export class YourEntity {
  // ...
}
```

---

## Useful Commands Reference

```bash
# SSH to VPS
ssh aegg@your-vps-ip

# View all containers
docker ps -a

# View container stats
docker stats

# Exec into container
docker-compose -f /opt/aegg/docker-compose.prod.yml exec backend sh

# Restart single service
docker-compose -f /opt/aegg/docker-compose.prod.yml restart backend

# View real-time logs
docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f --tail=100

# Database backup
docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T postgres \
    pg_dump -U aegg_user aegg_db > backup.sql

# Database restore
docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T postgres \
    psql -U aegg_user aegg_db < backup.sql

# Run TypeORM migrations
docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T backend \
    npm run migration:run

# Revert last migration
docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T backend \
    npm run migration:revert
```

---

## Support & Resources

- **GitHub Repository**: https://github.com/YOUR_USERNAME/aegg-new-app
- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Docker Documentation**: https://docs.docker.com/
- **NestJS Documentation**: https://docs.nestjs.com/

---

**Last Updated**: 2024-12-28
