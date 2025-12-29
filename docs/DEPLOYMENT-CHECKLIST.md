# AEGG Application - Deployment Checklist

Quick reference checklist for deploying AEGG application to production.

## 📋 Pre-Deployment Checklist

### 1. Repository Setup

- [ ] GitHub repository created
- [ ] Code pushed to repository
- [ ] CI/CD workflows committed (`.github/workflows/`)
- [ ] Dockerfiles created for backend and frontend
- [ ] `deploy/docker-compose.prod.yml` created

### 2. GitHub Configuration

- [ ] Repository secrets configured:
  - [ ] `VPS_HOST`
  - [ ] `VPS_USER`
  - [ ] `VPS_PORT` (usually 22)
  - [ ] `VPS_SSH_KEY`
  - [ ] `API_URL`
  - [ ] `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - [ ] `JWT_SECRET`

- [ ] Actions permissions:
  - [ ] Read and write permissions enabled
  - [ ] Allow GitHub Actions to create and approve pull requests

- [ ] Branch protection rules (optional but recommended):
  - [ ] Require pull request before merging
  - [ ] Require status checks to pass
  - [ ] Require review (1 approval)

### 3. VPS Setup

- [ ] VPS provisioned (Ubuntu 20.04+ or Debian 11+)
- [ ] DNS records configured:
  - [ ] `aegg.creapolis.mx` → VPS IP
  - [ ] `aegg-api.creapolis.mx` → VPS IP
  - [ ] `traefik.aegg.creapolis.mx` → VPS IP (optional)

- [ ] VPS initialization script run:
  ```bash
  sudo ./deploy/scripts/setup-vps.sh
  ```

- [ ] Deployment directory created: `/opt/aegg`
- [ ] Deploy user created: `aegg`
- [ ] Docker and Docker Compose installed
- [ ] Firewall configured (UFW)
- [ ] Fail2Ban installed and configured

### 4. Environment Configuration

- [ ] Secrets generated:
  ```bash
  ./deploy/scripts/generate-secrets.sh
  ```

- [ ] `.env` file created on VPS: `/opt/aegg/.env`
- [ ] Environment variables filled:
  - [ ] Database credentials
  - [ ] JWT secret
  - [ ] Application URLs
  - [ ] Let's Encrypt email
  - [ ] Traefik dashboard auth

- [ ] `docker-compose.prod.yml` copied to VPS:
  ```bash
  scp deploy/docker-compose.prod.yml aegg@vps:/opt/aegg/
  ```

### 5. SSH Key Configuration

- [ ] SSH key pair generated:
  ```bash
  ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/aegg_deploy
  ```

- [ ] Public key added to VPS:
  ```bash
  ssh-copy-id -i ~/.ssh/aegg_deploy.pub aegg@vps
  ```

- [ ] Private key added to GitHub secrets: `VPS_SSH_KEY`

- [ ] SSH connection tested:
  ```bash
  ssh aegg@vps "echo 'Connection successful'"
  ```

## 🚀 Deployment Checklist

### Option A: Automatic Deployment (Recommended)

1. **Push to main branch:**
   ```bash
   git checkout main
   git merge feature-branch
   git push origin main
   ```

2. **Monitor workflow:**
   - [ ] Go to Actions tab on GitHub
   - [ ] Verify "🧪 CI" workflow passes
   - [ ] Verify "🚀 Deploy to Production" workflow passes
   - [ ] Check for any errors in logs

3. **Verify deployment:**
   ```bash
   ssh aegg@vps
   cd /opt/aegg
   docker-compose -f docker-compose.prod.yml ps
   ```

### Option B: Manual Deployment via GitHub UI

1. **Trigger workflow manually:**
   - [ ] Go to Actions tab
   - [ ] Select "🚀 Deploy to Production"
   - [ ] Click "Run workflow"
   - [ ] Select branch: `main`
   - [ ] Click "Run workflow"

2. **Verify deployment (same as above)**

### Option C: Manual Deployment via SSH

1. **SSH into VPS:**
   ```bash
   ssh aegg@vps
   ```

2. **Navigate to deployment directory:**
   ```bash
   cd /opt/aegg
   ```

3. **Pull latest code:**
   ```bash
   git pull origin main
   ```

4. **Login to GitHub Container Registry:**
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
   ```

5. **Pull new images:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   ```

6. **Restart services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

7. **Run migrations:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec -T backend npm run migration:run
   ```

## ✅ Post-Deployment Checklist

### 1. Verify Services Running

```bash
ssh aegg@vps
cd /opt/aegg
docker-compose -f docker-compose.prod.yml ps
```

- [ ] `aegg-postgres` is running
- [ ] `aegg-backend` is running
- [ ] `aegg-frontend` is running
- [ ] `aegg-traefik` is running

### 2. Check Logs

```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs --tail=50 backend

# Frontend logs
docker-compose -f docker-compose.prod.yml logs --tail=50 frontend

# Database logs
docker-compose -f docker-compose.prod.yml logs --tail=50 postgres

# Traefik logs
docker-compose -f docker-compose.prod.yml logs --tail=50 traefik
```

- [ ] No error messages in logs
- [ ] Services started successfully
- [ ] Database migrations applied

### 3. Test Application

- [ ] Frontend loads: `https://aegg.creapolis.mx`
- [ ] API is accessible: `https://aegg-api.creapolis.mx/health`
- [ ] Login works
- [ ] Database operations work
- [ ] File uploads work (if applicable)

### 4. Verify SSL Certificates

- [ ] HTTPS works for frontend
- [ ] HTTPS works for backend API
- [ ] No browser security warnings
- [ ] Certificate is valid (not expired)

Check certificate:
```bash
curl -Iv https://aegg.creapolis.mx 2>&1 | grep -i "subject issuer"
```

### 5. Test Database Backups

```bash
# Manual backup test
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U aegg_user aegg_db > test_backup.sql

# Verify backup file created
ls -lh test_backup.sql
```

- [ ] Backup created successfully
- [ ] Backup file size is reasonable

### 6. Check Disk Space

```bash
df -h
docker system df
```

- [ ] Sufficient disk space available (>20% free)
- [ ] Docker images not taking excessive space

### 7. Verify Monitoring

- [ ] Traefik dashboard accessible: `https://traefik.aegg.creapolis.mx`
- [ ] Container stats look healthy:
  ```bash
  docker stats
  ```

## 📊 Ongoing Maintenance Checklist

### Daily

- [ ] Check application is responsive
- [ ] Monitor error rates
- [ ] Verify backups are created

### Weekly

- [ ] Review container logs for warnings
- [ ] Check disk space usage
- [ ] Review GitHub Actions runs

### Monthly

- [ ] Update server packages:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] Review and rotate secrets (if needed)
- [ ] Check for security vulnerabilities:
  ```bash
  cd backend && npm audit
  cd frontend && npm audit
  ```

- [ ] Review and optimize Docker resources:
  ```bash
  docker system prune -a --volumes
  ```

### Quarterly

- [ ] Review and update dependencies
- [ ] Test disaster recovery (backup restoration)
- [ ] Review access controls and SSH keys
- [ ] Performance optimization review

## 🚨 Emergency Procedures

### Rollback Deployment

1. **Identify previous working version:**
   ```bash
   ssh aegg@vps
   docker images | grep aegg-backend
   ```

2. **Update docker-compose.prod.yml with previous image tag:**
   ```yaml
   backend:
     image: ghcr.io/USERNAME/aegg-backend:previous_tag
   ```

3. **Restart services:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d backend
   ```

### Restore Database from Backup

1. **List available backups:**
   ```bash
   ls -lh /opt/aegg-backups/
   ```

2. **Restore backup:**
   ```bash
   docker-compose -f /opt/aegg/docker-compose.prod.yml exec -T postgres \
       psql -U aegg_user aegg_db < /opt/aegg-backups/backup_20231228.sql
   ```

### Restart All Services

```bash
ssh aegg@vps
cd /opt/aegg
docker-compose -f docker-compose.prod.yml restart
```

### View Real-time Logs

```bash
ssh aegg@vps
cd /opt/aegg
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📞 Support Contacts

- **GitHub Repository**: https://github.com/YOUR_USERNAME/aegg-new-app
- **Documentation**: See `docs/` directory
- **VPS Provider**: [Your VPS provider support]

---

**Last Updated**: 2024-12-28
