@echo off
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run --protocol http2 pawnpilots-monitor >> private\tunnel.log 2>&1
