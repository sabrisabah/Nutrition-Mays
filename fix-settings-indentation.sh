#!/bin/bash

# Fix Settings Indentation Error
# This script fixes the IndentationError by writing the settings directly

echo "============================================================"
echo "Fixing Settings Indentation Error"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    print_error "Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

print_status "Fixing Django settings indentation error..."

# Create backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup-indent-$(date +%Y%m%d_%H%M%S)

# Remove the problematic section completely
sed -i '/# Production Settings - Complete Fix/,/^}$/d' dr_mays_nutrition/settings.py

# Write the correct settings directly to avoid heredoc indentation issues
cat >> dr_mays_nutrition/settings.py << 'EOF'

# Production Settings - Complete Fix
import dj_database_url

# Database Configuration - PostgreSQL
DATABASES = {
    'default': dj_database_url.parse(config('DATABASE_URL', default='postgresql://drmays_user:drmays_secure_password_2024@localhost/drmays_nutrition'))
}

# Static Files Configuration - Fixed
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Only add STATICFILES_DIRS if the static directory exists and is not the same as STATIC_ROOT
if (BASE_DIR / 'static').exists() and (BASE_DIR / 'static') != (BASE_DIR / 'staticfiles'):
    STATICFILES_DIRS = [
        BASE_DIR / 'static',
    ]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# CORS settings for production
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://mayslife.uk",
    "https://www.mayslife.uk",
]

# Update ALLOWED_HOSTS
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'dr_mays_nutrition': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
EOF

print_status "Testing Django configuration syntax..."
if python3 -m py_compile dr_mays_nutrition/settings.py; then
    print_success "Django settings syntax is correct"
else
    print_error "Django settings syntax error detected"
    print_status "Checking the error..."
    python3 -m py_compile dr_mays_nutrition/settings.py 2>&1 | head -5
    exit 1
fi

print_status "Testing Django configuration..."
if python3 manage.py check --deploy; then
    print_success "Django configuration check passed"
else
    print_error "Django configuration check failed"
    print_status "Checking the error..."
    python3 manage.py check --deploy 2>&1 | head -10
    exit 1
fi

print_success "Settings indentation error fixed!"
echo ""
echo "🎉 Django settings should now work properly!"
echo "🌐 You can now run your application"
echo ""
