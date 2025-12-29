# AEGG Application - Deployment Configuration

Complete CI/CD and deployment configuration for AEGG application, based on ordo-todo's production-ready setup.

## 🚀 Quick Start

### 1. VPS Setup (One-Time)

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Clone repository
cd /opt
git clone https://github.com/YOUR_USERNAME/aegg-new-app.git
cd aegg-new-app/deploy/scripts

# Run setup script
chmod +x setup-vps.sh
sudo ./setup-vps.sh
```

### 2. Configure Secrets

```bash
# On your local machine
cd deploy/scripts
chmod +x generate-secrets.sh
./generate-secrets.sh
```

### 3. Deploy

**Automatic:** Push to `main` branch → GitHub Actions deploys automatically

**Manual:**
```bash
# Via GitHub UI: Actions → Deploy to Production → Run workflow

# OR via SSH
ssh aegg@vps "cd /opt/aegg && ./scripts/deploy.sh"
```

## 📁 What's Included

### GitHub Actions Workflows

- **`.github/workflows/ci.yml`** - Continuous Integration (tests, linting, builds)
- **`.github/workflows/deploy-production.yml`** - Production deployment to VPS

### Docker Configuration

- **`backend/Dockerfile`** - Multi-stage build for NestJS backend
- **`frontend/Dockerfile`** - Multi-stage build for Vite + React + Nginx
- **`frontend/nginx.conf`** - Production-ready Nginx configuration
- **`deploy/docker-compose.prod.yml`** - Production stack with Traefik, SSL, monitoring

### Deployment Scripts

- **`deploy/scripts/setup-vps.sh`** - Automated VPS provisioning
- **`deploy/scripts/backup.sh`** - Database backup automation
- **`deploy/scripts/generate-secrets.sh`** - Secure secret generation

### Documentation

- **`docs/VPS-SETUP-GUIDE.md`** - Complete VPS setup guide
- **`docs/GITHUB-SETUP-GUIDE.md`** - GitHub repository and CI/CD configuration
- **`docs/DEPLOYMENT-CHECKLIST.md`** - Quick deployment checklist
- **`deploy/.env.example`** - Environment variables template

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       GitHub Repository                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Push Code   │→ │ CI Workflow  │→ │ Deploy Workflow  │  │
│  └─────────────┘  └──────────────┘  └────────┬─────────┘  │
└──────────────────────────────────────────────────┼──────────┘
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     VPS Server                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Traefik    │  │   Backend    │  │   Frontend       │  │
│  │   (Proxy)    │←→│  (NestJS)    │←→│   (Nginx)        │  │
│  │   Port 443   │  │   Port 3000  │  │   Port 80        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                  │                                  │
│         └──────────┬───────┘                                  │
│                    ▼                                          │
│         ┌──────────────────┐                                  │
│         │   PostgreSQL     │                                  │
│         │   Database       │                                  │
│         └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Features

- ✅ Automated SSL certificates (Let's Encrypt via Traefik)
- ✅ Non-root Docker containers
- ✅ Firewall configured (UFW)
- ✅ Fail2Ban intrusion prevention
- ✅ Secure secret management (GitHub Secrets)
- ✅ SSH key-based authentication
- ✅ Automatic security updates
- ✅ Daily database backups
- ✅ Health checks for all services

## 📊 Features

### CI/CD Pipeline

- **Automated Testing**: Linting, unit tests, type checking
- **Docker Multi-stage Builds**: Optimized image sizes
- **GitHub Container Registry**: Integrated Docker registry
- **Zero-Downtime Deployments**: Rolling updates
- **Database Migrations**: Automatic on deployment
- **Health Checks**: All services monitored

### Production Stack

- **Traefik**: Reverse proxy with automatic SSL
- **PostgreSQL**: Production database with backups
- **NestJS**: Backend API with TypeORM
- **Vite + React**: Fast frontend with nginx
- **Docker Compose**: Orchestration and management

### Monitoring & Maintenance

- **Automatic Backups**: Daily database dumps (7-day retention)
- **Log Rotation**: Prevent disk space issues
- **Resource Monitoring**: Container stats and health
- **Traefik Dashboard**: Monitor routes and services
- **GitHub Actions Logs**: Deployment history

## 📖 Documentation Guides

### For First-Time Setup

1. **Read**: `docs/VPS-SETUP-GUIDE.md`
2. **Read**: `docs/GITHUB-SETUP-GUIDE.md`
3. **Use**: `docs/DEPLOYMENT-CHECKLIST.md` as reference

### For Regular Deployment

1. Push to `main` branch
2. Monitor GitHub Actions
3. Verify deployment on VPS

### For Troubleshooting

- Check logs: `docker-compose -f /opt/aegg/docker-compose.prod.yml logs -f`
- Review GitHub Actions logs
- See troubleshooting section in guides

## 🛠️ Common Commands

### VPS Management

```bash
# SSH into VPS
ssh aegg@your-vps-ip

# Check service status
cd /opt/aegg
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f postgres

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Database backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U aegg_user aegg_db > backup.sql

# Database restore
docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U aegg_user aegg_db < backup.sql
```

### Local Development

```bash
# Start development environment
docker-compose up -d

# Run backend
cd backend && npm run start:dev

# Run frontend
cd frontend && npm run dev

# Run tests
cd backend && npm test
cd frontend && npm test
```

## 📝 Environment Variables

Copy `deploy/.env.example` to `.env` and configure:

```bash
# Database
DB_NAME=aegg_db
DB_USER=aegg_user
DB_PASSWORD=secure_password_here

# JWT
JWT_SECRET=super_secret_key_here

# URLs
API_URL=https://aegg-api.creapolis.mx
FRONTEND_URL=https://aegg.creapolis.mx

# SSL
LETSENCRYPT_EMAIL=admin@creapolis.mx
```

**IMPORTANT**: Never commit `.env` file to repository!

## 🔄 Deployment Workflow

### Automatic (Recommended)

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR
git push origin feature/new-feature

# 4. After review, merge to main
# (via GitHub UI)

# 5. Automatic deployment triggered!
```

### Manual

```bash
# Via GitHub UI
# Actions → Deploy to Production → Run workflow

# Via SSH
ssh aegg@vps "cd /opt/aegg && ./scripts/deploy.sh"
```

## 📞 Support

- **Issues**: https://github.com/YOUR_USERNAME/aegg-new-app/issues
- **Documentation**: See `docs/` directory
- **Based on**: ordo-todo deployment strategy

## ✨ Credits

This deployment configuration is based on the production-ready setup from:
**https://github.com/tiagofur/ordo-todo**

Adapted for the AEGG accounting management system.

---

**Version**: 1.0.0
**Last Updated**: 2024-12-28
**License**: MIT
