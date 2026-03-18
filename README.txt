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


Current matches update:
- Renamed 'This Weekend’s Matches' tile to 'Current Matches'.
- Current Matches now shows only incomplete matches where scores are still pending.
- Completed matches for the week are hidden from the Current Matches tile.


Players tab enhancement:
- Updated Players tab to show richer stat cards similar to the shared Pickleheads-style reference.
- Each player card now includes rating, last played, sessions played, frequency, best week, and record summary.


Consistent tab styling update:
- Applied the same profile-card style across Hall of Fame, Playoffs, History, Rankings, and Schedule tabs.
- Tabs now feel visually consistent with the new Players tab design.


Current matches layout update:
- Made Current Matches a full-width tile so it can comfortably scale to more records.
- Moved Current Weekend Summary, Latest Results, and Top 3 Leaderboard below it.


This Week Progress update:
- Renamed Current Weekend Summary to This Week Progress.
- Replaced confusing summary text with total matches, completed, remaining, and clearer status messaging.
- Added progress bar for visual completion tracking.


Playoff progress clarity update:
- Renamed Playoffs tab card to Playoff Progress.
- Added clearer summary cards for format, stages, completed series, remaining series, and a progress bar.
- Reworked bracket sections to use the same player-profile-card visual style used elsewhere.


Public cleanup + players fix:
- League Snapshot and Championship Center now remain only on the Overview tab.
- Removed any stray duplicates from other tabs.
- Fixed Players tab rendering so player cards populate again.


v2 cleanup:
- Fixed section markup so Overview-only cards stay only in Overview.
- Players tab rendering restored.
- League Snapshot and Championship Center remain only in Overview.


Leaderboard + playoffs eligibility update:
- Added Matches Played to season leaderboard in admin and public league pages.
- Auto-highlighted playoff-eligible rows in the leaderboard.
- Playoffs tab now uses only playoff-eligible players and auto-seeds directly from the season leaderboard ranking.


Rules banners embedded:
- Added professional rules banners with icons/colors to public Rankings and Playoffs tabs.
- Added matching season leaderboard rules banner to admin.


Roster mid-season fix:
- Import Roster now merges/appends instead of replacing the existing roster.
- Add Player now reactivates existing inactive players instead of creating deletion-like behavior.
- Remove Selected Player now deactivates the player and removes them from pending availability and uncompleted schedules.
- Roster count now shows active and total players.


Latest results + history update:
- Latest Results tile is now full-width and shows all completed results.
- History tab now shows all completed match results inside each week card, while keeping the Top Snapshot.


Final mobile + UX updates:
- Hall of Fame now includes a Weekly Awards tile on the public page.
- Overview tab styling now matches the Players tab look and feel more closely without changing functionality.
- Added responsive/mobile CSS for admin and league pages.
- Added stronger mobile/browser Google data loading fallbacks for admin and league, including public-data and query-string support.
- Schedule generation is now blocked when all matches for the selected week/day are already completed.
