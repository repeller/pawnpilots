@echo off
title Spotify Authenticator
echo Wiping corrupt background sessions...
cd /d "%~dp0"
node private\reauth.js
pause
