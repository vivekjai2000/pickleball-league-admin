Files included

admin.html
- admin-only page
- league setup
- roster import
- schedule generation
- score entry
- weekly ranking
- season leaderboard
- export public-data.js

public.html
- read-only viewer
- automatically loads public-data.js from the same folder
- also supports manual file loading

public-data.js
- starter data file
- replace this file with the one exported from admin.html whenever you want to publish updates

Best workflow
1. Host admin.html privately or use it only yourself.
2. Host public.html and public-data.js in your public GitHub Pages repo.
3. After updates in admin.html, click Export public-data.js.
4. Replace the old public-data.js in GitHub with the new one.
5. Refresh the public page after GitHub Pages updates.
