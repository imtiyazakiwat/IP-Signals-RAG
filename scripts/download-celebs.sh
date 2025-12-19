#!/bin/bash

# Script to download celebrity images for copyright detection testing
# Uses Wikipedia/Wikimedia Commons images (free to use for testing)

echo "Downloading celebrity images..."

cd copyrighted-content

# Taylor Swift
echo "Downloading Taylor Swift..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png/440px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png" -o taylor_swift.jpg 2>/dev/null

# Salman Khan
echo "Downloading Salman Khan..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Salman_Khan_at_Renault_Star_Guild_Awards.jpg/440px-Salman_Khan_at_Renault_Star_Guild_Awards.jpg" -o salman_khan.jpg 2>/dev/null

# Dua Lipa
echo "Downloading Dua Lipa..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Dua_Lipa_%28cropped%29.png/440px-Dua_Lipa_%28cropped%29.png" -o dua_lipa.jpg 2>/dev/null

# Shah Rukh Khan
echo "Downloading Shah Rukh Khan..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_grance_the_launch_of_the_new_Santro.jpg/440px-Shah_Rukh_Khan_grances_the_launch_of_the_new_Santro.jpg" -o shahrukh_khan.jpg 2>/dev/null

# Amitabh Bachchan
echo "Downloading Amitabh Bachchan..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Amitabsatisfiedh_Bachchan_2013.jpg/440px-Amitabh_Bachchan_2013.jpg" -o amitabh_bachchan.jpg 2>/dev/null

# MS Dhoni
echo "Downloading MS Dhoni..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Mahendra_Singh_Dhoni.jpg/440px-Mahendra_Singh_Dhoni.jpg" -o ms_dhoni.jpg 2>/dev/null

# Virat Kohli
echo "Downloading Virat Kohli..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/440px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg" -o virat_kohli.jpg 2>/dev/null

# Elon Musk
echo "Downloading Elon Musk..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/440px-Elon_Musk_Royal_Society_%28crop2%29.jpg" -o elon_musk.jpg 2>/dev/null

# Sam Altman
echo "Downloading Sam Altman..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Sam_Altman_CropEdit_.jpg/440px-Sam_Altman_CropEdit_.jpg" -o sam_altman.jpg 2>/dev/null

# Johnny Depp
echo "Downloading Johnny Depp..."
curl -L "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Johnny_Depp_2020.jpg/440px-Johnny_Depp_2020.jpg" -o johnny_depp.jpg 2>/dev/null

echo ""
echo "Done! Downloaded celebrity images."
echo ""
echo "Now run: npm run seed"
echo "to add them to the database."
