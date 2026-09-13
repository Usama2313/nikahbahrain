@echo off
echo ===================================================
echo Starting Nikah Bahrain Matrimonial Platform
echo ===================================================
echo Backend API:  http://localhost:5000/api
echo Frontend Web: http://localhost:5173
echo ===================================================
start "Nikah Bahrain Backend" cmd /k "cd /d %~dp0server && node index.js"
start "Nikah Bahrain Frontend" cmd /k "cd /d %~dp0client && npm run dev"
echo Both servers started!
pause
