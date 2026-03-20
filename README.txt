Google Drive photo storage patch

Built on:
- pouncey_photo_upload_safe_fix_v2.zip

What changed:
- photos are no longer stored inline as base64 in the saved league state
- Admin and League now upload player photos to Google Drive through Apps Script
- only the Drive image URL is stored in player profiles
- old photo file can be replaced when a new photo is uploaded for the same player
- optional Google Drive Folder ID field added in Admin > Google Sheets Connection
- if blank, Apps Script auto-creates/uses a "Pouncey Player Photos" folder near the spreadsheet

Important:
- You must replace Code.gs in Apps Script and redeploy the web app after updating it
- Then replace admin/index.html and league/index.html in GitHub

Files to replace:
- Code.gs
- admin/index.html
- league/index.html
- public-data.js

Deployment steps:
1. Open your Apps Script project
2. Replace Code.gs with the patched version
3. Deploy > Manage deployments > Edit > New version > Deploy
4. Copy the web app URL if it changed
5. In Admin, save/test the Apps Script URL
6. Upload a player photo again

Expected result:
- player profiles will store a Google Drive image URL, not a base64 blob
- League page remains stable after photo updates
