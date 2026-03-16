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
