# PowerShell script to generate logo variants for SEO and social media
# This script creates multiple logo formats needed for proper display in search results and social media

Write-Host "Generating logo variants for Dr. Mays Nutrition System..." -ForegroundColor Green

# Check if ImageMagick is available
$magickPath = Get-Command magick -ErrorAction SilentlyContinue
if (-not $magickPath) {
    Write-Host "ImageMagick not found. Please install ImageMagick first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://imagemagick.org/script/download.php#windows" -ForegroundColor Yellow
    Write-Host "2. Or install via Chocolatey: choco install imagemagick" -ForegroundColor Yellow
    Write-Host "3. Or install via winget: winget install ImageMagick.ImageMagick" -ForegroundColor Yellow
    exit 1
}

# Create output directories
$outputDirs = @("public", "dist")
foreach ($dir in $outputDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
}

# Source logo file
$sourceLogo = "public\logo.svg"

if (-not (Test-Path $sourceLogo)) {
    Write-Host "Source logo file not found: $sourceLogo" -ForegroundColor Red
    exit 1
}

Write-Host "Source logo found: $sourceLogo" -ForegroundColor Green

# Generate different logo variants
$logoVariants = @(
    @{Name="favicon-16x16.png"; Size="16x16"; Description="16x16 favicon"},
    @{Name="favicon-32x32.png"; Size="32x32"; Description="32x32 favicon"},
    @{Name="apple-touch-icon.png"; Size="180x180"; Description="Apple touch icon"},
    @{Name="logo-og.png"; Size="1200x630"; Description="Open Graph image for social media"},
    @{Name="logo-square.png"; Size="512x512"; Description="Square logo for general use"},
    @{Name="logo-small.png"; Size="192x192"; Description="Small logo for mobile"}
)

foreach ($variant in $logoVariants) {
    Write-Host "Generating $($variant.Description)..." -ForegroundColor Cyan
    
    foreach ($outputDir in $outputDirs) {
        $outputPath = "$outputDir\$($variant.Name)"
        
        try {
            # Convert SVG to PNG with specified dimensions
            & magick convert -background transparent -size $($variant.Size) "$sourceLogo" "$outputPath"
            
            if (Test-Path $outputPath) {
                Write-Host "  ✓ Created: $outputPath" -ForegroundColor Green
            } else {
                Write-Host "  ✗ Failed to create: $outputPath" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "  ✗ Error creating $outputPath : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Create a simple favicon.ico file
Write-Host "Creating favicon.ico..." -ForegroundColor Cyan
foreach ($outputDir in $outputDirs) {
    $icoPath = "$outputDir\favicon.ico"
    try {
        & magick convert -background transparent -size 32x32 "$sourceLogo" "$icoPath"
        if (Test-Path $icoPath) {
            Write-Host "  ✓ Created: $icoPath" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ✗ Error creating $icoPath : $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nLogo generation complete!" -ForegroundColor Green
Write-Host "Generated files:" -ForegroundColor Yellow
Write-Host "- favicon.ico (32x32 ICO format)" -ForegroundColor White
Write-Host "- favicon-16x16.png (16x16 PNG)" -ForegroundColor White
Write-Host "- favicon-32x32.png (32x32 PNG)" -ForegroundColor White
Write-Host "- apple-touch-icon.png (180x180 PNG)" -ForegroundColor White
Write-Host "- logo-og.png (1200x630 PNG for social media)" -ForegroundColor White
Write-Host "- logo-square.png (512x512 PNG)" -ForegroundColor White
Write-Host "- logo-small.png (192x192 PNG)" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Deploy these files to your server" -ForegroundColor White
Write-Host "2. Test your site with Facebook Debugger: https://developers.facebook.com/tools/debug/" -ForegroundColor White
Write-Host "3. Test with Twitter Card Validator: https://cards-dev.twitter.com/validator" -ForegroundColor White
Write-Host "4. Test with Google Rich Results Test: https://search.google.com/test/rich-results" -ForegroundColor White
