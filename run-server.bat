@echo off
cd /d "%~dp0"
node server.js >> private\server.log 2>&1
