#!/bin/bash

cd copyrighted-content

echo "Downloading celebrity images from Wikimedia Commons..."

# Cristiano Ronaldo
echo "1. Cristiano Ronaldo..."
curl -L -A "Mozilla/5.0" -o cristiano_ronaldo.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Cristiano_Ronaldo_2018.jpg/400px-Cristiano_Ronaldo_2018.jpg" 2>/dev/null

# Lionel Messi
echo "2. Lionel Messi..."
curl -L -A "Mozilla/5.0" -o lionel_messi.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Lionel_Messi_20180626.jpg/400px-Lionel_Messi_20180626.jpg" 2>/dev/null

# Priyanka Chopra
echo "3. Priyanka Chopra..."
curl -L -A "Mozilla/5.0" -o priyanka_chopra.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Priyanka_Chopra_at_TIFF_2017.jpg/400px-Priyanka_Chopra_at_TIFF_2017.jpg" 2>/dev/null

# Deepika Padukone
echo "4. Deepika Padukone..."
curl -L -A "Mozilla/5.0" -o deepika_padukone.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Deepika_Padukone_at_Twitter_HQ_%2815374482446%29.jpg/400px-Deepika_Padukone_at_Twitter_HQ_%2815374482446%29.jpg" 2>/dev/null

# Alia Bhatt
echo "5. Alia Bhatt..."
curl -L -A "Mozilla/5.0" -o alia_bhatt.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg/400px-Alia_Bhatt_at_Berlinale_2022_Ausschnitt.jpg" 2>/dev/null

# Ranveer Singh
echo "6. Ranveer Singh..."
curl -L -A "Mozilla/5.0" -o ranveer_singh.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Ranveer_Singh_snapped_at_the_trailer_launch_of_Simmba.jpg/400px-Ranveer_Singh_snapped_at_the_trailer_launch_of_Simmba.jpg" 2>/dev/null

# Akshay Kumar
echo "7. Akshay Kumar..."
curl -L -A "Mozilla/5.0" -o akshay_kumar.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Akshay_Kumar_at_Kesari_trailer_launch_in_2019.jpg/400px-Akshay_Kumar_at_Kesari_trailer_launch_in_2019.jpg" 2>/dev/null

# Hrithik Roshan
echo "8. Hrithik Roshan..."
curl -L -A "Mozilla/5.0" -o hrithik_roshan.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Hrithik_at_Rado_launch.jpg/400px-Hrithik_at_Rado_launch.jpg" 2>/dev/null

# Katrina Kaif
echo "9. Katrina Kaif..."
curl -L -A "Mozilla/5.0" -o katrina_kaif.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Katrina_Kaif_at_IIFA_2019.jpg/400px-Katrina_Kaif_at_IIFA_2019.jpg" 2>/dev/null

# Kareena Kapoor
echo "10. Kareena Kapoor..."
curl -L -A "Mozilla/5.0" -o kareena_kapoor.jpg "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Kareena_Kapoor_Khan_snapped_at_the_airport_%2802%29.jpg/400px-Kareena_Kapoor_Khan_snapped_at_the_airport_%2802%29.jpg" 2>/dev/null

echo ""
echo "Checking file sizes..."
ls -la *.jpg 2>/dev/null | awk '{if($5 > 5000) print "✓", $9, $5, "bytes"; else print "✗", $9, $5, "bytes (may be corrupted)"}'
