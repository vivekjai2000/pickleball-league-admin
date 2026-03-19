Mobile Google sync fix

Why the error happened:
- the League page was trying a direct POST to Apps Script
- some mobile browsers fail that request even when desktop works
- the profile was saved locally, but the remote Google sync failed

Fix included:
- added robust Apps Script request helper for the League page
- now tries POST first, then GET fallback automatically
- improved error messaging for profile save and score save

Replace:
- league/index.html
