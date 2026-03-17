Pouncey Tract Pickleball League

Production-ready structure
- /admin/   Admin panel
- /league/  Member-facing league page
- /player/  Player profile page
- /assets/pouncey-logo.jpeg  Shared production logo
- /public-data.js  Shared client data fallback file
- /Code.gs  Google Apps Script backend

Recommended GitHub Pages URLs
- Admin:  https://<your-site>/admin/
- League: https://<your-site>/league/
- Player: https://<your-site>/player/

Branding status
- New Pouncey logo applied across admin, league, and player pages
- Pouncey spelling standardized across frontend and backend
- Admin password gate enabled
- League and player routes cleaned up
- Public page uses Google Sheets live data when configured

Important deployment checklist
1. Upload the full package contents to your repo root
2. Replace Code.gs in Google Apps Script
3. Save and redeploy the Web App
4. Hard refresh browser once after deploy

Default admin password
- PounceyAdmin2026!

Change admin password
- Open /admin/index.html
- Find ADMIN_PASSWORD
- Replace it with your own value
