#!/bin/bash

echo "Downloading celebrity images..."
cd copyrighted-content

echo "1/10 Dua Lipa..."
curl -L -o dua_lipa.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Dua_Lipa_%28cropped%29.png/400px-Dua_Lipa_%28cropped%29.png"

echo "2/10 MS Dhoni..."
curl -L -o ms_dhoni.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Mahendra_Singh_Dhoni_at_Strength_Matters_2017.jpg/400px-Mahendra_Singh_Dhoni_at_Strength_Matters_2017.jpg"

echo "3/10 Sam Altman..."
curl -L -o sam_altman.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Sam_Altman_2024.jpg/400px-Sam_Altman_2024.jpg"

echo "4/10 Shah Rukh Khan..."
curl -L -o shahrukh_khan.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg/400px-Shah_Rukh_Khan_graces_the_launch_of_the_new_Santro.jpg"

echo "5/10 Amitabh Bachchan..."
curl -L -o amitabh_bachchan.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Amitabh_Bachchan_2013.jpg/400px-Amitabh_Bachchan_2013.jpg"

echo "6/10 Taylor Swift..."
curl -L -o taylor_swift.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png/400px-191125_Taylor_Swift_at_the_2019_American_Music_Awards_%28cropped%29.png"

echo "7/10 Salman Khan..."
curl -L -o salman_khan.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Salman_Khan_at_Renault_Star_Guild_Awards.jpg/400px-Salman_Khan_at_Renault_Star_Guild_Awards.jpg"

echo "8/10 Virat Kohli..."
curl -L -o virat_kohli.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg/400px-Virat_Kohli_during_the_India_vs_Aus_4th_Test_match_at_Narendra_Modi_Stadium_on_09_March_2023.jpg"

echo "9/10 Elon Musk..."
curl -L -o elon_musk.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/400px-Elon_Musk_Royal_Society_%28crop2%29.jpg"

echo "10/10 Johnny Depp..."
curl -L -o johnny_depp.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Johnny_Depp_2020.jpg/400px-Johnny_Depp_2020.jpg"

echo ""
echo "Done! Checking file sizes..."
ls -la *.jpg | grep -E "(taylor|salman|dua|shahrukh|amitabh|dhoni|virat|elon|sam_altman|johnny)"
