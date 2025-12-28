#!/bin/bash
# Script de ayuda para configurar secrets de GitHub Actions
# USO: ./setup-github-secrets.sh

echo "🔐 Configuración de Secrets de GitHub Actions"
echo ""
echo "Este script te ayuda a recolectar los valores para configurar en GitHub"
echo ""

# Función para leer input seguro
read_secret() {
    local prompt="$1"
    local default="$2"
    local value

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -s -p "$prompt: " value
        echo ""
        echo "$value"
    fi
}

# VPS Configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  VPS / SSH Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
VPS_HOST=$(read_secret "VPS_HOST (IP o dominio del VPS)" "74.208.234.244")
VPS_USER=$(read_secret "VPS_USER (Usuario SSH)" "root")
VPS_PORT=$(read_secret "VPS_PORT (Puerto SSH)" "22")
VPS_SSH_KEY=$(read_secret "VPS_SSH_KEY (Ruta a llave privada, ej: ~/.ssh/id_rsa)")

# Leer el contenido de la llave SSH si es una ruta
if [ -f "$VPS_SSH_KEY" ]; then
    echo "✅ Leyendo llave SSH desde: $VPS_SSH_KEY"
    VPS_SSH_KEY_CONTENT=$(cat "$VPS_SSH_KEY")
else
    VPS_SSH_KEY_CONTENT="$VPS_SSH_KEY"
fi

# Database Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  Database Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DB_HOST=$(read_secret "DB_HOST (Host de BD, ej: localhost:5440)" "localhost:5440")
DB_PORT=$(read_secret "DB_PORT (Puerto PostgreSQL)" "5432")
DB_USER=$(read_secret "DB_USER (Usuario BD)" "postgres")
DB_PASSWORD=$(read_secret "DB_PASSWORD (Contraseña BD)")
DB_NAME=$(read_secret "DB_NAME (Nombre BD)" "appdb")

# JWT Configuration
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 JWT Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Generando JWT_SECRET seguro..."
JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || echo "CHANGE_THIS_SECRET_KEY_MIN_64_CHARS")
echo "✅ JWT_SECRET generado: ${JWT_SECRET:0:20}..."

# Display collected values (sanitized)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Valores Recolectados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VPS_HOST: $VPS_HOST"
echo "VPS_USER: $VPS_USER"
echo "VPS_PORT: $VPS_PORT"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_USER: $DB_USER"
echo "DB_PASSWORD: ***"
echo "DB_NAME: $DB_NAME"
echo "JWT_SECRET: ${JWT_SECRET:0:20}... (longitud: ${#JWT_SECRET})"
echo ""

# Create .env file locally
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Creando .env.local para pruebas..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat > .env.local << EOF
DATABASE_HOST=${DB_HOST%:*}
DATABASE_PORT=${DB_PORT}
DATABASE_USER=${DB_USER}
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
NODE_ENV=development
EOF

echo "✅ Archivo .env.local creado"
echo ""

# Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 Instrucciones para Configurar Secrets en GitHub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a tu repositorio en GitHub"
echo "2. Navega a: Settings > Secrets and variables > Actions"
echo "3. Haz clic en 'New repository secret'"
echo "4. Crea los siguientes secrets:"
echo ""
echo "   VPS_HOST         = $VPS_HOST"
echo "   VPS_USER         = $VPS_USER"
echo "   VPS_PORT         = $VPS_PORT"
echo "   VPS_SSH_KEY      = (Pega el contenido de $VPS_SSH_KEY o usa el valor abajo)"
echo ""
echo "   DB_HOST          = $DB_HOST%:*}"
echo "   DB_PORT          = $DB_PORT"
echo "   DB_USER          = $DB_USER"
echo "   DB_PASSWORD      = $DB_PASSWORD"
echo "   DB_NAME          = $DB_NAME"
echo "   JWT_SECRET       = $JWT_SECRET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Contenido de VPS_SSH_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$VPS_SSH_KEY_CONTENT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "¿Deseas generar un script para automatizar la configuración de secrets? (y/N): " generate_script

if [[ "$generate_script" =~ ^[Yy]$ ]]; then
    echo "📝 Generando script de configuración de secrets..."
    echo ""
    echo "Este script requiere gh CLI instalado:"
    echo "  brew install gh  # macOS"
    echo "  sudo apt install gh  # Ubuntu/Debian"
    echo ""
    echo "O instala desde: https://cli.github.com/"
    echo ""

    cat > configure-github-secrets.sh << 'SCRIPT_EOF'
#!/bin/bash
# Configurar secrets de GitHub usando gh CLI
# Requiere: gh auth login

set -e

echo "🔐 Configurando secrets en GitHub..."

gh secret set VPS_HOST --body "$VPS_HOST"
gh secret set VPS_USER --body "$VPS_USER"
gh secret set VPS_PORT --body "$VPS_PORT"
gh secret set VPS_SSH_KEY --body "$VPS_SSH_KEY_CONTENT"
gh secret set DB_HOST --body "${DB_HOST%:*}"
gh secret set DB_PORT --body "$DB_PORT"
gh secret set DB_USER --body "$DB_USER"
gh secret set DB_PASSWORD --body "$DB_PASSWORD"
gh secret set DB_NAME --body "$DB_NAME"
gh secret set JWT_SECRET --body "$JWT_SECRET"

echo ""
echo "✅ Todos los secrets han sido configurados en GitHub!"
SCRIPT_EOF

    chmod +x configure-github-secrets.sh
    echo "✅ Script creado: configure-github-secrets.sh"
    echo ""
    echo "Para usarlo:"
    echo "1. Instala gh CLI: https://cli.github.com/"
    echo "2. Autenticarte: gh auth login"
    echo "3. Ejecuta: ./configure-github-secrets.sh"
fi

echo ""
echo "✅ Setup completado!"
echo ""
echo "📝 Resumen:"
echo "  - .env.local creado para pruebas locales"
echo "  - Valores recolectados listos para configurar en GitHub"
echo "  - Documentación disponible en .github/workflows/README.md"
echo ""
echo "🚀 Próximos pasos:"
echo "  1. Configura los secrets en GitHub (manually o con el script generado)"
echo "  2. Verifica que las rutas del servidor coincidan con el workflow"
echo "  3. Haz push a main para activar el deployment automático"
echo ""
