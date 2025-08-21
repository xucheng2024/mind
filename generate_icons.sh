#!/bin/bash

# Generate square PWA icons from logo.png
# This script creates square icons by centering the logo and adding padding

echo "Generating PWA icons..."

# Create a temporary square version of the logo
# First, create a 512x512 square with white background
sips -s format png --setProperty formatOptions '{"backgroundColor": "#FFFFFF"}' \
     -z 512 512 public/logo.png --out public/icons/logo-square-512.png

# Generate different sizes
sizes=(72 96 128 144 152 192 384 512)

for size in "${sizes[@]}"; do
    echo "Generating ${size}x${size} icon..."
    sips -z $size $size public/icons/logo-square-512.png --out public/icons/logo-${size}x${size}.png
done

# Create maskable icons (with padding for safe area)
echo "Generating maskable icons..."
sips -z 192 192 public/icons/logo-square-512.png --out public/icons/logo-maskable-192.png
sips -z 512 512 public/icons/logo-square-512.png --out public/icons/logo-maskable-512.png

echo "Icons generated in public/icons/ directory"
echo "You can now update manifest.json to use these new square icons"
