#!/bin/bash

# Script to create macOS app icon (.icns) from SVG

echo "🎨 Creating BizOps.app icon..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo "Please install it with: brew install imagemagick"
    exit 1
fi

# Create temporary directory for icon sizes
mkdir -p icon.iconset

# Generate all required icon sizes
echo "📐 Generating icon sizes..."

# 16x16
convert -background none -resize 16x16 public/app-icon.svg "icon.iconset/icon_16x16.png"
convert -background none -resize 32x32 public/app-icon.svg "icon.iconset/icon_16x16@2x.png"

# 32x32
convert -background none -resize 32x32 public/app-icon.svg "icon.iconset/icon_32x32.png"
convert -background none -resize 64x64 public/app-icon.svg "icon.iconset/icon_32x32@2x.png"

# 128x128
convert -background none -resize 128x128 public/app-icon.svg "icon.iconset/icon_128x128.png"
convert -background none -resize 256x256 public/app-icon.svg "icon.iconset/icon_128x128@2x.png"

# 256x256
convert -background none -resize 256x256 public/app-icon.svg "icon.iconset/icon_256x256.png"
convert -background none -resize 512x512 public/app-icon.svg "icon.iconset/icon_256x256@2x.png"

# 512x512
convert -background none -resize 512x512 public/app-icon.svg "icon.iconset/icon_512x512.png"
convert -background none -resize 1024x1024 public/app-icon.svg "icon.iconset/icon_512x512@2x.png"

echo "🔨 Creating .icns file..."
iconutil -c icns icon.iconset -o AppIcon.icns

echo "📦 Copying to BizOps.app..."
cp AppIcon.icns ../BizOps.app/Contents/Resources/AppIcon.icns

echo "🧹 Cleaning up temporary files..."
rm -rf icon.iconset

echo "🔄 Refreshing macOS icon cache..."
# Clear icon cache
rm -rf ~/Library/Caches/com.apple.iconservices.store
# Restart Finder and Dock
killall Finder
killall Dock

echo "✅ Done! The new icon should appear in a moment."
echo ""
echo "If the icon doesn't update immediately:"
echo "1. Wait a few seconds for macOS to refresh"
echo "2. Log out and log back in"
echo "3. Or run: sudo rm -rf /Library/Caches/com.apple.iconservices.store"


