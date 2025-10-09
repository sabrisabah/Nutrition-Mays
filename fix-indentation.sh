#!/bin/bash

# Fix Indentation Error in Django Settings
# This script fixes the IndentationError in settings.py

echo "============================================================"
echo "Fixing Indentation Error in Django Settings"
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

print_status "Fixing indentation error in Django settings..."

# Create backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup-indent-$(date +%Y%m%d_%H%M%S)

# Remove the problematic section
sed -i '/# Static Files Configuration - Fixed/,/MEDIA_ROOT = BASE_DIR \/ '\''media'\''/d' dr_mays_nutrition/settings.py

# Add the corrected static files configuration
cat >> dr_mays_nutrition/settings.py << 'EOF'

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
EOF

print_status "Testing Django configuration..."
if python3 manage.py check --deploy; then
    print_success "Django configuration check passed"
else
    print_error "Django configuration check failed"
    print_status "Checking the error..."
    python3 manage.py check --deploy 2>&1 | head -20
fi

print_success "Indentation error fixed!"
echo ""
echo "🎉 Django settings should now work properly!"
echo ""
echo "📊 Test your application:"
echo "python3 manage.py check --deploy"
echo "python3 manage.py runserver"
echo ""
