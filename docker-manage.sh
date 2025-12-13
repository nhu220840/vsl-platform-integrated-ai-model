#!/bin/bash
# VSL Platform - Quick Docker Management Script

set -e

BACKEND_DIR="vsl-platform-backend"
FRONTEND_DIR="vsl-platform-frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if docker-compose exists
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Navigate to backend directory
cd_backend() {
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    cd "$BACKEND_DIR"
    print_success "Changed to backend directory"
}

# Start all services
start_all() {
    print_header "Starting VSL Platform (All 5 Services)"
    cd_backend
    
    print_warning "This will take 2-3 minutes for first-time startup..."
    docker-compose up -d --build
    
    echo ""
    print_success "All services are starting!"
    echo ""
    echo "Check status with: $0 status"
    echo "View logs with: $0 logs"
}

# Stop all services
stop_all() {
    print_header "Stopping VSL Platform"
    cd_backend
    
    docker-compose down
    print_success "All services stopped"
}

# Restart all services
restart_all() {
    print_header "Restarting VSL Platform"
    stop_all
    echo ""
    start_all
}

# Show status
show_status() {
    print_header "VSL Platform Status"
    cd_backend
    
    docker-compose ps
    
    echo ""
    print_header "Health Checks"
    
    # Backend
    if curl -s http://localhost:8081/api/auth/login > /dev/null 2>&1; then
        print_success "Backend: http://localhost:8081 ✓"
    else
        print_warning "Backend: http://localhost:8081 ✗"
    fi
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend: http://localhost:3000 ✓"
    else
        print_warning "Frontend: http://localhost:3000 ✗"
    fi
    
    # AI Service
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        print_success "AI Service: http://localhost:5000 ✓"
    else
        print_warning "AI Service: http://localhost:5000 ✗"
    fi
    
    # Elasticsearch
    if curl -s http://localhost:9200 > /dev/null 2>&1; then
        print_success "Elasticsearch: http://localhost:9200 ✓"
    else
        print_warning "Elasticsearch: http://localhost:9200 ✗"
    fi
    
    # PostgreSQL
    if docker exec vsl-postgres pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL: localhost:5433 ✓"
    else
        print_warning "PostgreSQL: localhost:5433 ✗"
    fi
}

# Show logs
show_logs() {
    print_header "VSL Platform Logs"
    cd_backend
    
    if [ -z "$1" ]; then
        docker-compose logs -f --tail=100
    else
        docker-compose logs -f --tail=100 "$1"
    fi
}

# Clean up (remove volumes)
clean_all() {
    print_header "Clean VSL Platform"
    print_warning "⚠️  This will DELETE all database data and Elasticsearch indices!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        cd_backend
        docker-compose down -v
        print_success "All services and volumes removed"
    else
        print_warning "Cleanup cancelled"
    fi
}

# Show usage
show_usage() {
    echo "VSL Platform Docker Management"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       Start all 5 services (Postgres, Elasticsearch, AI, Backend, Frontend)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status and health checks"
    echo "  logs        Show logs (all services or specific: logs backend)"
    echo "  clean       Stop and remove all services + volumes (⚠️ DATA LOSS)"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                # Start all services"
    echo "  $0 logs                 # View all logs"
    echo "  $0 logs backend         # View backend logs only"
    echo "  $0 status               # Check if services are running"
    echo ""
    echo "Services:"
    echo "  - Frontend:        http://localhost:3000"
    echo "  - Backend API:     http://localhost:8081/api"
    echo "  - AI Service:      http://localhost:5000"
    echo "  - Elasticsearch:   http://localhost:9200"
    echo "  - PostgreSQL:      localhost:5433"
}

# Main script
check_docker

case "$1" in
    start)
        start_all
        ;;
    stop)
        stop_all
        ;;
    restart)
        restart_all
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$2"
        ;;
    clean)
        clean_all
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
