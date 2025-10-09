#!/bin/bash

# Quick Fix for Indentation Error
# This script quickly fixes the IndentationError in settings.py

echo "============================================================"
echo "Quick Fix for Indentation Error"
echo "============================================================"

# Check if we're in the correct directory
if [ ! -f "manage.py" ]; then
    echo "❌ Please run this script from the project root directory (where manage.py is located)"
    exit 1
fi

echo "🔧 Fixing indentation error..."

# Create backup
cp dr_mays_nutrition/settings.py dr_mays_nutrition/settings.py.backup-indent

# Remove the problematic section and add the correct one
sed -i '/# Static Files Configuration - Fixed/,/MEDIA_ROOT = BASE_DIR \/ '\''media'\''/d' dr_mays_nutrition/settings.py

# Add the corrected configuration
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

echo "🧪 Testing Django configuration..."
if python3 manage.py check --deploy; then
    echo "✅ Django configuration check passed"
else
    echo "❌ Django configuration check failed"
    echo "📋 Error details:"
    python3 manage.py check --deploy 2>&1 | head -10
fi

echo ""
echo "🎉 Indentation error should now be fixed!"
echo "🌐 You can now run your application"
echo ""
