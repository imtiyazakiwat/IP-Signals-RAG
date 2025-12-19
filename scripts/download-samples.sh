#!/bin/bash

# Script to download sample images for the copyrighted-content folder
# Uses free stock images from Unsplash (via their Source API)

echo "Downloading sample images for copyright detection testing..."

cd copyrighted-content

# Download 15 sample images from Unsplash (free to use)
# These will serve as our "copyrighted" reference database

echo "Downloading nature images..."
curl -L "https://picsum.photos/800/600" -o sample_01.jpg
curl -L "https://picsum.photos/800/600" -o sample_02.jpg
curl -L "https://picsum.photos/800/600" -o sample_03.jpg

echo "Downloading architecture images..."
curl -L "https://picsum.photos/600/800" -o sample_04.jpg
curl -L "https://picsum.photos/600/800" -o sample_05.jpg

echo "Downloading landscape images..."
curl -L "https://picsum.photos/1200/600" -o sample_06.jpg
curl -L "https://picsum.photos/1200/600" -o sample_07.jpg
curl -L "https://picsum.photos/1200/600" -o sample_08.jpg

echo "Downloading portrait images..."
curl -L "https://picsum.photos/400/600" -o sample_09.jpg
curl -L "https://picsum.photos/400/600" -o sample_10.jpg

echo "Downloading square images..."
curl -L "https://picsum.photos/600/600" -o sample_11.jpg
curl -L "https://picsum.photos/600/600" -o sample_12.jpg
curl -L "https://picsum.photos/600/600" -o sample_13.jpg
curl -L "https://picsum.photos/600/600" -o sample_14.jpg
curl -L "https://picsum.photos/600/600" -o sample_15.jpg

echo ""
echo "Done! Downloaded 15 sample images to copyrighted-content/"
echo ""
echo "Note: These are random images from Lorem Picsum."
echo "For better testing, replace with actual images you want to detect."
echo ""
echo "Next steps:"
echo "1. Add your GEMINI_API_KEY to .env"
echo "2. Run: docker-compose up db -d"
echo "3. Run: npm run seed"
echo "4. Run: npm run dev"
