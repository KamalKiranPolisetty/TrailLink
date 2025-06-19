#!/bin/bash

# TrailLink Deployment Script
set -e

echo "🚀 Starting TrailLink deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if [ ! -f "backend/.env" ]; then
        print_error "backend/.env file not found. Please create it from backend/.env.example"
        exit 1
    fi
    
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found"
        exit 1
    fi
    
    print_status "Requirements check passed ✅"
}

# Build and deploy with Docker
deploy_docker() {
    print_status "Building Docker image..."
    docker build -t traillink-backend .
    
    print_status "Starting services with Docker Compose..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Health check
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✅"
    else
        print_error "Backend health check failed ❌"
        exit 1
    fi
}

# Deploy to EAS (Expo Application Services)
deploy_mobile() {
    print_status "Deploying mobile app to EAS..."
    
    # Check if EAS CLI is installed
    if ! command -v eas &> /dev/null; then
        print_warning "EAS CLI not found. Installing..."
        npm install -g @expo/eas-cli
    fi
    
    # Login to EAS (if not already logged in)
    print_status "Checking EAS authentication..."
    if ! eas whoami &> /dev/null; then
        print_warning "Please login to EAS:"
        eas login
    fi
    
    # Build for production
    print_status "Building production app..."
    eas build --platform all --profile production
    
    print_status "Mobile app build submitted to EAS ✅"
}

# Main deployment function
main() {
    echo "TrailLink Deployment Script"
    echo "=========================="
    
    # Parse command line arguments
    DEPLOY_BACKEND=false
    DEPLOY_MOBILE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --backend)
                DEPLOY_BACKEND=true
                shift
                ;;
            --mobile)
                DEPLOY_MOBILE=true
                shift
                ;;
            --all)
                DEPLOY_BACKEND=true
                DEPLOY_MOBILE=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [--backend] [--mobile] [--all]"
                echo "  --backend  Deploy backend services"
                echo "  --mobile   Deploy mobile app to EAS"
                echo "  --all      Deploy both backend and mobile"
                exit 0
                ;;
            *)
                print_error "Unknown option $1"
                exit 1
                ;;
        esac
    done
    
    # If no options specified, deploy all
    if [ "$DEPLOY_BACKEND" = false ] && [ "$DEPLOY_MOBILE" = false ]; then
        DEPLOY_BACKEND=true
        DEPLOY_MOBILE=true
    fi
    
    check_requirements
    
    if [ "$DEPLOY_BACKEND" = true ]; then
        deploy_docker
    fi
    
    if [ "$DEPLOY_MOBILE" = true ]; then
        deploy_mobile
    fi
    
    print_status "🎉 Deployment completed successfully!"
    
    if [ "$DEPLOY_BACKEND" = true ]; then
        echo ""
        echo "Backend Services:"
        echo "- API: http://localhost:5000"
        echo "- Health Check: http://localhost:5000/health"
        echo "- MongoDB: localhost:27017"
    fi
    
    if [ "$DEPLOY_MOBILE" = true ]; then
        echo ""
        echo "Mobile App:"
        echo "- Check EAS dashboard for build status"
        echo "- Download builds from EAS when ready"
    fi
}

# Run main function
main "$@"
