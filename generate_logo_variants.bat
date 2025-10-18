@echo off
echo Generating logo variants for Dr. Mays Nutrition System...

REM Check if ImageMagick is available
magick -version >nul 2>&1
if errorlevel 1 (
    echo ImageMagick not found. Please install ImageMagick first:
    echo 1. Download from: https://imagemagick.org/script/download.php#windows
    echo 2. Or install via Chocolatey: choco install imagemagick
    echo 3. Or install via winget: winget install ImageMagick.ImageMagick
    pause
    exit /b 1
)

REM Create output directories
if not exist "public" mkdir public
if not exist "dist" mkdir dist

REM Check if source logo exists
if not exist "public\logo.svg" (
    echo Source logo file not found: public\logo.svg
    pause
    exit /b 1
)

echo Source logo found: public\logo.svg

REM Generate favicon variants
echo Generating favicon variants...
magick convert -background transparent -size 16x16 "public\logo.svg" "public\favicon-16x16.png"
magick convert -background transparent -size 16x16 "public\logo.svg" "dist\favicon-16x16.png"

magick convert -background transparent -size 32x32 "public\logo.svg" "public\favicon-32x32.png"
magick convert -background transparent -size 32x32 "public\logo.svg" "dist\favicon-32x32.png"

magick convert -background transparent -size 32x32 "public\logo.svg" "public\favicon.ico"
magick convert -background transparent -size 32x32 "public\logo.svg" "dist\favicon.ico"

REM Generate Apple touch icon
echo Generating Apple touch icon...
magick convert -background transparent -size 180x180 "public\logo.svg" "public\apple-touch-icon.png"
magick convert -background transparent -size 180x180 "public\logo.svg" "dist\apple-touch-icon.png"

REM Generate Open Graph image for social media
echo Generating Open Graph image...
magick convert -background transparent -size 1200x630 "public\logo.svg" "public\logo-og.png"
magick convert -background transparent -size 1200x630 "public\logo.svg" "dist\logo-og.png"

REM Generate square logo
echo Generating square logo...
magick convert -background transparent -size 512x512 "public\logo.svg" "public\logo-square.png"
magick convert -background transparent -size 512x512 "public\logo.svg" "dist\logo-square.png"

REM Generate small logo
echo Generating small logo...
magick convert -background transparent -size 192x192 "public\logo.svg" "public\logo-small.png"
magick convert -background transparent -size 192x192 "public\logo.svg" "dist\logo-small.png"

echo.
echo Logo generation complete!
echo Generated files:
echo - favicon.ico (32x32 ICO format)
echo - favicon-16x16.png (16x16 PNG)
echo - favicon-32x32.png (32x32 PNG)
echo - apple-touch-icon.png (180x180 PNG)
echo - logo-og.png (1200x630 PNG for social media)
echo - logo-square.png (512x512 PNG)
echo - logo-small.png (192x192 PNG)
echo.
echo Next steps:
echo 1. Deploy these files to your server
echo 2. Test your site with Facebook Debugger: https://developers.facebook.com/tools/debug/
echo 3. Test with Twitter Card Validator: https://cards-dev.twitter.com/validator
echo 4. Test with Google Rich Results Test: https://search.google.com/test/rich-results
echo.
pause
