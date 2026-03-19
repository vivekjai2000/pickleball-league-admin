Profile persistence rules implemented

Rules implemented:
- profile records are permanent until admin removes them
- schedule refresh must not delete players
- sync merges profile data and does not blindly replace the full player list
- refreshing public data, season data, rankings, or schedules must never delete player profiles

Replace:
- admin/index.html
- league/index.html
- public-data.js
