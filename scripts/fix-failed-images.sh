#!/bin/bash

cd copyrighted-content

echo "Fixing failed celebrity images with alternative sources..."

echo "1/4 Dua Lipa..."
curl -L -o dua_lipa.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Dua_Lipa_performing_at_the_2018_BRIT_Awards_%28cropped%29.png/400px-Dua_Lipa_performing_at_the_2018_BRIT_Awards_%28cropped%29.png"

echo "2/4 MS Dhoni..."
curl -L -o ms_dhoni.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/MS_Dhoni_in_2016.jpg/400px-MS_Dhoni_in_2016.jpg"

echo "3/4 Sam Altman..."
curl -L -o sam_altman.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sam_Altman_TechCrunch_SF_2019_Day_2_Oct_3_%28cropped%29.jpg/400px-Sam_Altman_TechCrunch_SF_2019_Day_2_Oct_3_%28cropped%29.jpg"

echo "4/4 Amitabh Bachchan..."
curl -L -o amitabh_bachchan.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Amitabh_Bachchan_-_Kalyan_Jewellers_ad_shoot.jpg/400px-Amitabh_Bachchan_-_Kalyan_Jewellers_ad_shoot.jpg"

echo ""
echo "Checking results..."
ls -la dua_lipa.jpg ms_dhoni.jpg sam_altman.jpg amitabh_bachchan.jpg
