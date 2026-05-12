@echo off
echo ==========================================
echo GitHub'ga o'zgarishlarni yuklash boshlandi...
echo ==========================================

git add .
git commit -m "Avtomatik yangilanish: %date% %time%"
git push origin main

echo ==========================================
echo Barcha o'zgarishlar muvaffaqiyatli yuklandi!
echo ==========================================
pause
