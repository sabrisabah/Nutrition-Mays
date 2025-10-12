#!/bin/bash

# =============================================================================
# Project Upload Script
# =============================================================================
# This script helps upload your project files to the server
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_header "Project Upload Script"

# Server details
SERVER_IP="152.42.167.125"
SERVER_USER="ubuntu"  # Change this to your server username
PROJECT_DIR="/srv/mayslife/Nutrition-Mays"

print_status "This script will upload your project files to the server"
print_status "Server: $SERVER_USER@$SERVER_IP"
print_status "Target Directory: $PROJECT_DIR"
echo ""

# Check if rsync is available
if ! command -v rsync &> /dev/null; then
    print_error "rsync is not installed. Please install it first:"
    echo "  Windows: Install WSL or use Git Bash"
    echo "  Linux/Mac: sudo apt install rsync (Ubuntu/Debian) or brew install rsync (Mac)"
    exit 1
fi

# Upload project files
print_status "Uploading project files..."
rsync -avz --progress \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='venv' \
    --exclude='.env' \
    --exclude='db.sqlite3' \
    --exclude='dist' \
    ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

if [ $? -eq 0 ]; then
    print_success "Project files uploaded successfully!"
else
    print_error "Upload failed. Please check your connection and try again."
    exit 1
fi

print_status "Setting proper permissions on server..."
ssh $SERVER_USER@$SERVER_IP "sudo chown -R \$(whoami):\$(whoami) $PROJECT_DIR && chmod -R 755 $PROJECT_DIR"

print_success "Upload complete!"
echo ""
print_status "Next steps:"
echo "1. SSH into your server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Run the fresh installation script: bash fresh_install.sh"
echo "3. Your application will be available at https://mayslife.uk"
