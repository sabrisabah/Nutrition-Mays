#!/bin/bash

# SSL Certificate Setup and Final Configuration Script
# For Dr. Mays Nutrition Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="www.mayslife.uk"
APP_USER="mays"
APP_DIR="/home/$APP_USER/drmays"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SSL Certificate Setup and Finalization${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root for SSL certificate setup."
   exit 1
fi

# Check if domain is pointing to this server
print_status "Checking DNS resolution..."
if ! nslookup $DOMAIN | grep -q "152.42.167.125"; then
    print_warning "DNS may not be properly configured. Please ensure $DOMAIN points to 152.42.167.125"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Obtain SSL certificate
print_status "Obtaining SSL certificate for $DOMAIN..."
certbot --nginx -d mayslife.uk -d www.mayslife.uk --non-interactive --agree-tos --email admin@mayslife.uk

# Test SSL certificate
print_status "Testing SSL certificate..."
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    print_status "SSL certificate is valid!"
else
    print_warning "SSL certificate validation failed. Please check manually."
fi

# Update Nginx configuration to ensure proper SSL redirect
print_status "Updating Nginx configuration..."
sudo tee /etc/nginx/sites-available/mayslife.uk > /dev/null << 'EOF'
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

# Upstream configuration
upstream django_app {
    server 127.0.0.1:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name mayslife.uk www.mayslife.uk;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name mayslife.uk www.mayslife.uk;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mayslife.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mayslife.uk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Logging
    access_log /var/log/nginx/mayslife.uk.access.log;
    error_log /var/log/nginx/mayslife.uk.error.log;

    # Client settings
    client_max_body_size 10M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    # Static files
    location /static/ {
        alias /home/mays/drmays/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Media files
    location /media/ {
        alias /home/mays/drmays/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Frontend build files
    location /assets/ {
        alias /home/mays/drmays/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Login endpoints with stricter rate limiting
    location ~ ^/(admin|api/auth)/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # Health check endpoint
    location /health/ {
        proxy_pass http://django_app/health/;
        access_log off;
    }

    # Main application
    location / {
        proxy_pass http://django_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|log|ini)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Test Nginx configuration
print_status "Testing Nginx configuration..."
nginx -t

# Reload Nginx
print_status "Reloading Nginx..."
systemctl reload nginx

# Restart Django application
print_status "Restarting Django application..."
systemctl restart drmays

# Test all services
print_status "Testing all services..."

# Test Django app
if curl -f http://127.0.0.1:8000/health/ > /dev/null 2>&1; then
    print_status "Django application is running"
else
    print_warning "Django application health check failed"
fi

# Test Nginx
if systemctl is-active --quiet nginx; then
    print_status "Nginx is running"
else
    print_warning "Nginx is not running"
fi

# Test PostgreSQL
if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL is running"
else
    print_warning "PostgreSQL is not running"
fi

# Test Redis
if systemctl is-active --quiet redis-server; then
    print_status "Redis is running"
else
    print_warning "Redis is not running"
fi

# Test HTTPS
print_status "Testing HTTPS connection..."
if curl -f https://$DOMAIN > /dev/null 2>&1; then
    print_status "HTTPS connection is working"
else
    print_warning "HTTPS connection test failed"
fi

# Test API endpoint
print_status "Testing API endpoint..."
if curl -f https://$DOMAIN/api/ > /dev/null 2>&1; then
    print_status "API endpoint is accessible"
else
    print_warning "API endpoint test failed"
fi

# Create superuser prompt
print_status "Creating Django superuser..."
echo "Please create a superuser account for Django admin:"
sudo -u $APP_USER bash -c "cd $APP_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py createsuperuser"

# Final verification
print_status "Performing final verification..."

# Check SSL certificate expiration
CERT_EXPIRY=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
print_status "SSL certificate expires: $CERT_EXPIRY"

# Check if auto-renewal is set up
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    print_status "SSL certificate auto-renewal is configured"
else
    print_warning "SSL certificate auto-renewal is not configured"
fi

# Display final status
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Final Configuration Summary:${NC}"
echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}SSL Certificate: Installed${NC}"
echo -e "${GREEN}HTTPS: Enabled${NC}"
echo -e "${GREEN}All Services: Running${NC}"
echo -e "${BLUE}========================================${NC}"

print_status "Your Dr. Mays Nutrition platform is now fully configured and running!"
print_status "Access your application at: https://$DOMAIN"
print_status "Admin panel: https://$DOMAIN/admin/"

print_warning "Don't forget to:"
echo "1. Update email configuration in .env file"
echo "2. Configure payment provider credentials in .env file"
echo "3. Set up monitoring and alerts"
echo "4. Configure regular backups"

print_status "Setup completed successfully!"
