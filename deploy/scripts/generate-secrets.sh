#!/bin/bash
#############################################
# Generate secure secrets for AEGG deployment
#############################################

set -e

echo "🔐 Generating secure secrets for AEGG deployment..."

# Function to generate random string
generate_secret() {
    length=${1:-32}
    openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c $length
}

# Generate secrets
DB_PASSWORD=$(generate_secret 32)
JWT_SECRET=$(generate_secret 64)
NEXTAUTH_SECRET=$(generate_secret 32)
TRAEFIK_PASSWORD=$(generate_secret 16)

# Generate bcrypt hash for Traefik dashboard
# Note: You'll need to install apache2-utils: apt-get install apache2-utils
TRAEFIK_BASIC_AUTH="admin:\$(openssl passwd -apr1 $TRAEFIK_PASSWORD)"

# Create .env file
cat > .env.prod <<EOF
# Database Configuration
DB_NAME=aegg_db
DB_USER=aegg_user
DB_PASSWORD=$DB_PASSWORD
DB_HOST=postgres
DB_PORT=5432

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=7d

# Application URLs
API_URL=https://aegg-api.creapolis.mx
FRONTEND_URL=https://aegg.creapolis.mx

# Let's Encrypt
LETSENCRYPT_EMAIL=admin@creapolis.mx

# Traefik Dashboard Auth
TRAEFIK_BASIC_AUTH=$TRAEFIK_BASIC_AUTH

# GitHub Container Registry
GITHUB_REPOSITORY=your-username/aegg-new-app
GITHUB_REPOSITORY_OWNER=your-username

# Backup Configuration
BACKUP_RETENTION_DAYS=7

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@creapolis.mx
EOF

echo "✅ Secrets generated successfully!"
echo ""
echo "📝 Save these credentials in a secure location:"
echo ""
echo "🔑 Database Password: $DB_PASSWORD"
echo "🔑 JWT Secret: $JWT_SECRET"
echo "🔑 Traefik Dashboard Password: $TRAEFIK_PASSWORD"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Copy the generated .env.prod file to your VPS"
echo "   2. Rename it to .env"
echo "   3. Store these credentials securely (password manager)"
echo "   4. Delete this file after copying: rm .env.prod"
echo ""
echo "🚧 Next steps:"
echo "   1. Update GITHUB_REPOSITORY and GITHUB_REPOSITORY_OWNER in .env.prod"
echo "   2. Update LETSENCRYPT_EMAIL with your email"
echo "   3. Copy .env.prod to VPS: scp .env.prod user@vps:/opt/aegg/.env"
echo "   4. Add SSH key to GitHub for registry access"
