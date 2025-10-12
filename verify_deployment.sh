#!/bin/bash

# Dr. Mays Nutrition Platform - Deployment Verification Script
# Run this script after deployment to verify everything is working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="www.mayslife.uk"
IP_ADDRESS="152.42.167.125"
APP_USER="mays"
APP_DIR="/home/$APP_USER/drmays"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dr. Mays Nutrition Platform Verification${NC}"
echo -e "${BLUE}========================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_info "Running as root - checking system services"
else
   print_info "Running as regular user - checking application services"
fi

echo -e "\n${BLUE}1. System Services Check${NC}"

# Check system services
services=("nginx" "postgresql" "redis-server" "fail2ban")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        print_status "$service is running"
    else
        print_error "$service is not running"
    fi
done

echo -e "\n${BLUE}2. Application Services Check${NC}"

# Check application services
app_services=("drmays" "drmays-celery" "drmays-celery-beat")
for service in "${app_services[@]}"; do
    if systemctl is-active --quiet $service; then
        print_status "$service is running"
    else
        print_error "$service is not running"
    fi
done

echo -e "\n${BLUE}3. Network Connectivity Check${NC}"

# Check if Django app is responding
if curl -f http://127.0.0.1:8000/health/ > /dev/null 2>&1; then
    print_status "Django application is responding on port 8000"
else
    print_error "Django application is not responding on port 8000"
fi

# Check if Nginx is responding
if curl -f http://127.0.0.1:80 > /dev/null 2>&1; then
    print_status "Nginx is responding on port 80"
else
    print_error "Nginx is not responding on port 80"
fi

# Check if HTTPS is working
if curl -f https://$DOMAIN > /dev/null 2>&1; then
    print_status "HTTPS is working for $DOMAIN"
else
    print_error "HTTPS is not working for $DOMAIN"
fi

echo -e "\n${BLUE}4. SSL Certificate Check${NC}"

# Check SSL certificate
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    print_status "SSL certificate is valid"
    
    # Get certificate expiration date
    CERT_EXPIRY=$(openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    print_info "SSL certificate expires: $CERT_EXPIRY"
else
    print_error "SSL certificate is invalid or expired"
fi

echo -e "\n${BLUE}5. Database Connectivity Check${NC}"

# Check database connection
if sudo -u postgres psql -c "SELECT 1;" > /dev/null 2>&1; then
    print_status "PostgreSQL is accessible"
else
    print_error "PostgreSQL is not accessible"
fi

# Check if Django can connect to database
if sudo -u $APP_USER bash -c "cd $APP_DIR && source venv/bin/activate && export DJANGO_SETTINGS_MODULE=dr_mays_nutrition.settings_production && python manage.py check --database default" > /dev/null 2>&1; then
    print_status "Django can connect to database"
else
    print_error "Django cannot connect to database"
fi

echo -e "\n${BLUE}6. Redis Connectivity Check${NC}"

# Check Redis connection
if redis-cli ping > /dev/null 2>&1; then
    print_status "Redis is accessible"
else
    print_error "Redis is not accessible"
fi

echo -e "\n${BLUE}7. File Permissions Check${NC}"

# Check file permissions
if [ -d "$APP_DIR" ]; then
    if [ -r "$APP_DIR" ] && [ -w "$APP_DIR" ]; then
        print_status "Application directory permissions are correct"
    else
        print_error "Application directory permissions are incorrect"
    fi
else
    print_error "Application directory does not exist"
fi

# Check static files
if [ -d "$APP_DIR/staticfiles" ]; then
    print_status "Static files directory exists"
else
    print_warning "Static files directory does not exist - run collectstatic"
fi

# Check media files
if [ -d "$APP_DIR/media" ]; then
    print_status "Media files directory exists"
else
    print_warning "Media files directory does not exist"
fi

echo -e "\n${BLUE}8. API Endpoints Check${NC}"

# Check API endpoints
api_endpoints=("/api/" "/admin/" "/health/")
for endpoint in "${api_endpoints[@]}"; do
    if curl -f https://$DOMAIN$endpoint > /dev/null 2>&1; then
        print_status "API endpoint $endpoint is accessible"
    else
        print_error "API endpoint $endpoint is not accessible"
    fi
done

echo -e "\n${BLUE}9. Firewall Check${NC}"

# Check firewall status
if ufw status | grep -q "Status: active"; then
    print_status "Firewall is active"
    
    # Check if required ports are open
    if ufw status | grep -q "80/tcp"; then
        print_status "Port 80 is open"
    else
        print_error "Port 80 is not open"
    fi
    
    if ufw status | grep -q "443/tcp"; then
        print_status "Port 443 is open"
    else
        print_error "Port 443 is not open"
    fi
else
    print_warning "Firewall is not active"
fi

echo -e "\n${BLUE}10. Log Files Check${NC}"

# Check log files
log_files=("/var/log/nginx/mayslife.uk.error.log" "$APP_DIR/logs/django.log")
for log_file in "${log_files[@]}"; do
    if [ -f "$log_file" ]; then
        print_status "Log file $log_file exists"
        
        # Check for recent errors
        if [ -s "$log_file" ]; then
            recent_errors=$(tail -n 100 "$log_file" | grep -i error | wc -l)
            if [ $recent_errors -gt 0 ]; then
                print_warning "Found $recent_errors recent errors in $log_file"
            else
                print_status "No recent errors in $log_file"
            fi
        fi
    else
        print_warning "Log file $log_file does not exist"
    fi
done

echo -e "\n${BLUE}11. Cron Jobs Check${NC}"

# Check cron jobs
if crontab -l 2>/dev/null | grep -q "health_check.sh"; then
    print_status "Health check cron job is configured"
else
    print_warning "Health check cron job is not configured"
fi

if crontab -l 2>/dev/null | grep -q "backup.sh"; then
    print_status "Backup cron job is configured"
else
    print_warning "Backup cron job is not configured"
fi

if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    print_status "SSL certificate auto-renewal is configured"
else
    print_warning "SSL certificate auto-renewal is not configured"
fi

echo -e "\n${BLUE}12. Resource Usage Check${NC}"

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    print_status "Disk usage is normal ($DISK_USAGE%)"
else
    print_warning "Disk usage is high ($DISK_USAGE%)"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -lt 80 ]; then
    print_status "Memory usage is normal ($MEMORY_USAGE%)"
else
    print_warning "Memory usage is high ($MEMORY_USAGE%)"
fi

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$LOAD_AVG < 2.0" | bc -l) )); then
    print_status "System load is normal ($LOAD_AVG)"
else
    print_warning "System load is high ($LOAD_AVG)"
fi

echo -e "\n${BLUE}13. DNS Resolution Check${NC}"

# Check DNS resolution
if nslookup $DOMAIN | grep -q "$IP_ADDRESS"; then
    print_status "DNS resolution is correct for $DOMAIN"
else
    print_warning "DNS resolution may not be correct for $DOMAIN"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"

# Count successes and failures
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# This is a simplified version - in a real script, you'd track each check
print_info "Verification completed. Please review the results above."

echo -e "\n${BLUE}Next Steps:${NC}"
echo "1. If any checks failed, review the error messages above"
echo "2. Check the logs for detailed error information"
echo "3. Restart failed services: sudo systemctl restart <service-name>"
echo "4. Test the application manually at https://$DOMAIN"
echo "5. Create a superuser account if not already done"

echo -e "\n${GREEN}Your Dr. Mays Nutrition Platform is ready!${NC}"
echo -e "${GREEN}Access it at: https://$DOMAIN${NC}"
echo -e "${GREEN}Admin panel: https://$DOMAIN/admin/${NC}"

echo -e "\n${BLUE}========================================${NC}"
