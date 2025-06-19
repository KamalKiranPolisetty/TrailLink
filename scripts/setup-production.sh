#!/bin/bash

# Production Setup Script for TrailLink
set -e

echo "🔧 Setting up TrailLink for production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Generate secure secrets
generate_secrets() {
    print_step "Generating secure secrets..."
    
    JWT_SECRET=$(openssl rand -base64 32)
    SESSION_SECRET=$(openssl rand -base64 32)
    
    print_status "Secrets generated ✅"
}

# Setup environment files
setup_env_files() {
    print_step "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        
        # Replace placeholders with generated secrets
        sed -i.bak "s/your-super-secure-jwt-secret-here-minimum-32-characters/$JWT_SECRET/g" backend/.env
        sed -i.bak "s/your-super-secure-session-secret-here-minimum-32-characters/$SESSION_SECRET/g" backend/.env
        
        # Remove backup file
        rm backend/.env.bak
        
        print_status "Backend .env file created"
        print_warning "Please update the following in backend/.env:"
        echo "  - MONGO_URI (your MongoDB connection string)"
        echo "  - CORS_ORIGIN (your frontend URL)"
    else
        print_warning "backend/.env already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_status "Frontend .env file created"
        print_warning "Please update BACKEND_URL in .env with your production backend URL"
    else
        print_warning ".env already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install global dependencies for deployment
    print_status "Installing global dependencies..."
    if ! command -v eas &> /dev/null; then
        npm install -g @expo/eas-cli
    fi
    
    print_status "Dependencies installed ✅"
}

# Setup EAS project
setup_eas() {
    print_step "Setting up EAS project..."
    
    if [ ! -f "eas.json" ]; then
        print_error "eas.json not found. This should have been created by the deployment preparation."
        exit 1
    fi
    
    # Initialize EAS project
    if ! eas whoami &> /dev/null; then
        print_warning "Please login to EAS:"
        eas login
    fi
    
    # Create EAS project if it doesn't exist
    if ! eas project:info &> /dev/null; then
        print_status "Creating new EAS project..."
        eas project:init
    fi
    
    print_status "EAS project setup complete ✅"
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p backend/logs
    mkdir -p ssl
    
    print_status "Directories created ✅"
}

# Setup SSL certificates (placeholder)
setup_ssl() {
    print_step "Setting up SSL certificates..."
    
    if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
        print_warning "SSL certificates not found in ssl/ directory"
        print_warning "For production, you'll need to:"
        echo "  1. Obtain SSL certificates from a CA (Let's Encrypt, etc.)"
        echo "  2. Place cert.pem and key.pem in the ssl/ directory"
        echo "  3. Update nginx.conf with your domain name"
        
        # Create self-signed certificates for development
        print_status "Creating self-signed certificates for development..."
        openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        print_warning "Self-signed certificates created. Replace with proper certificates for production!"
    fi
    
    print_status "SSL setup complete ✅"
}

# Validate configuration
validate_config() {
    print_step "Validating configuration..."
    
    # Check if required files exist
    required_files=(
        "backend/.env"
        "eas.json"
        "Dockerfile"
        "docker-compose.yml"
        "nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file $file not found"
            exit 1
        fi
    done
    
    print_status "Configuration validation passed ✅"
}

# Main setup function
main() {
    echo "TrailLink Production Setup"
    echo "========================="
    
    generate_secrets
    create_directories
    setup_env_files
    install_dependencies
    setup_eas
    setup_ssl
    validate_config
    
    print_status "🎉 Production setup completed successfully!"
    
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your MongoDB URI and other production values"
    echo "2. Update .env with your production backend URL"
    echo "3. Replace SSL certificates in ssl/ directory with proper certificates"
    echo "4. Update nginx.conf with your domain name"
    echo "5. Run './scripts/deploy.sh --all' to deploy"
    
    echo ""
    echo "Important files created/updated:"
    echo "- backend/.env (with generated secrets)"
    echo "- .env (frontend environment)"
    echo "- ssl/cert.pem and ssl/key.pem (self-signed, replace for production)"
    echo "- backend/logs/ (log directory)"
}

# Make sure we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the TrailLink root directory"
    exit 1
fi

# Run main function
main "$@"
