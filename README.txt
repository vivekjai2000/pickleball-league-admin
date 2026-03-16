What to upload

Admin repo:
- index.html  -> rename admin.html to index.html if you want the admin page at the main repo link

Public access:
Option A: same repo
- upload public.html
- upload public-data.js
- members open:
  https://vivekjai2000.github.io/pickleball-league-admin/public.html

Option B: separate public repo
- create a public repo
- upload public.html as index.html
- upload public-data.js
- share that repo's GitHub Pages link

Which button creates the public file?
- In admin.html, click: Export public-data.js

Update workflow:
1. Use the admin page
2. Click Export public-data.js
3. Replace the existing public-data.js file in GitHub
4. Refresh the public page


Fix in v5:
- Public page Schedule and History tabs are fixed for mobile and GitHub Pages.


Enhancement in v6:
- Added Current Weekend Summary card on the public overview page.
- Public overview now highlights combined Saturday + Sunday counts for the latest active week.


Enhancement in v7:
- Removed subtitle text from the public page header.
- Updated the page background to a cleaner, more professional soft neutral tone.


Enhancement in v8:
- Applied the same cleaner, subtitle-free, soft neutral UI treatment across admin.html and public.html for a more consistent experience.


Enhancement in v9:
- Reworded the confusing 'Optional manual load' section.
- It is now clearly marked as testing-only.
- Automatic loading remains the default behavior for league members.


v11 additions:
- Added Players tab to public page.
- Added player.html profile page.
- Added Top 12 playoff view.
- Public URL for profiles: /player.html?id=PLAYER_NAME
- Export button in admin remains: Export public-data.js


v12 additions:
- Added approved summer absences handling in admin.
- Players listed absent for a week are excluded from scheduling that week.
- Leaderboard remains fair for missed weeks by using win percentage instead of raw wins.
- Playoff eligibility now uses configurable minimum participation % of available weeks plus minimum matches played.
- Public leaderboard, player profiles, and playoffs reflect playoff eligibility.
- Admin button that publishes the public file is still: Export public-data.js


v13 simplification:
- Removed the Availability / Approved Absences section to reduce admin data entry.
- Scheduling now uses active players only, without week-by-week absence tracking.
- Leaderboard still uses win percentage, which is the simplest fair approach when players miss summer weeks.
- Playoff eligibility now uses a configurable minimum matches threshold only.
- Public leaderboard, player profiles, and playoff view reflect this simplified rule.


v14:
- Added a simple editable field in Admin > League Setup for Minimum matches for playoffs.
- Changing this field updates playoff eligibility after you export public-data.js.

v15:
- Added lightweight weekend Check-In tab in admin for current-week availability without bringing back heavy absence tracking.
- Added Quick Tools tab with one-click generation of all active schedules.
- Public page now includes a Hall of Fame tab.
- Public player profiles and playoffs remain active.
- Mobile-friendly score entry remains in admin.
- Export button in admin remains: Export public-data.js


v16:
- Added Playoff Manager tab in admin.
- Admin can seed Top 12 playoffs from the current leaderboard.
- Admin can select winners round by round: Play-In, Quarterfinals, Semifinals, Final.
- Public Playoffs tab now shows true progression if playoff results have been entered.
- Export button in admin remains: Export public-data.js


v17:
- Added Championship Center to the public home screen.
- Added latest results widget on the public overview page.
- Public overview now highlights champion, final status, and recent completed matches.


v18:
- Added configurable playoff format in admin (Top 4 / Top 8 / Top 12).
- Upgraded automatic doubles round robin scheduler with stronger fairness logic for partner diversity, opponent diversity, and rest balancing.
- Upgraded rating system to a DUPR-style score-aware rating model.
- Improved mobile-friendly sports-app feel with sticky tab navigation.
- Public playoffs respect the selected playoff format and show real progression if results are entered.
- Export button in admin remains: Export public-data.js


v19:
- Fixed broken logo issue by embedding the shared logo directly into public.html, admin.html, and player.html.
- Added automatic logo fallback logic.
- Included a physical fallback image file: logo-fallback.jpg

v20:
- Added Google Sheets Sync tab in admin.
- Admin can save the full league state to Google Sheets.
- Admin can load the full league state back from Google Sheets.
- Reset button clears the Google Sheets league data so you can start another league later.
- Public page and player page can auto-read live data from Google Sheets through Apps Script.
- Included Apps Script template: Code.gs
- Included setup guide: GOOGLE_SHEETS_SETUP.txt


v21 fix:
- Fixed Google Sheets URL Save button in admin.
- URL now saves directly to state and localStorage.
- Admin field now repopulates automatically on reload.


v22:
- Added automatic Google Sheets sync after score save.
- Also auto-syncs after schedule generation, check-in save, and playoff updates when a Google Script URL is configured.
- Manual 'Save Entire League to Google Sheets' still remains available.


v23:
- Added automatic DUPR-style rating and leaderboard calculation in Code.gs.
- Apps Script now computes the live season leaderboard from Google Sheets data.
- A Leaderboard tab is written into the Google Sheet automatically.
- Public page reads the computed Google Sheets leaderboard automatically.


v24 fix:
- Restored missing admin helper functions pushProfileToUI() and parseRoster().
- Fixed Master Roster import section.
- Hardened admin load logic so the roster tab and league setup continue to work reliably.


v25 fix:
- Hardened Master Roster import so it no longer silently fails.
- Added better parsing for Name, Rating lines.
- Added a quick roster count below the roster status.
- Import now updates roster status even if summary/save helpers fail.


v26:
- Master Roster import now auto-syncs to Google Sheets when a Google Script URL is configured.
- Add Player and Remove Player actions also auto-sync to Google Sheets.


v27:
- Public page now allows score entry only for current active scheduled matches.
- Added strict pickleball score validation: valid examples 11-9, 13-11, 15-13. Invalid examples 11-10, 12-11, 14-13, 9-7.
- Public score saves now update Google Sheets directly through Apps Script.
- Completed matches remain read-only after save.
