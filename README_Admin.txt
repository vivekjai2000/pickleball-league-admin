# Pouncy Tract Pickleball League – Public Site

This is the public website for the Pouncy Tract Weekend Pickleball League.

The site automatically displays league information including:

• Leaderboard
• Weekly schedule
• Match results
• Player ratings
• Playoff bracket

All data is automatically updated from Google Sheets.

--------------------------------------------------

HOW DATA UPDATES

The public page reads league data from a Google Apps Script endpoint connected to Google Sheets.

When the admin updates scores or schedules, the data is automatically saved to Google Sheets.

The public site fetches the latest data and updates automatically.

No manual updates are required.

--------------------------------------------------

PUBLIC PAGE FEATURES

League Overview
Displays league title, season dates, and location.

Leaderboard
Shows player rankings based on rating system similar to DUPR.

Weekly Schedule
Displays upcoming matches and completed scores.

Player Profiles
Each player page shows:
• match history
• rating
• results

Playoffs
Displays playoff bracket and results.

--------------------------------------------------

TECHNOLOGY

Frontend
HTML
JavaScript

Hosting
GitHub Pages

Data Source
Google Sheets via Apps Script

--------------------------------------------------

URL STRUCTURE

Public site example

/public.html

Player page example

/player.html?player=John

--------------------------------------------------

DESIGN

Mobile friendly layout designed to resemble a modern sports app.

--------------------------------------------------

LEAGUE DETAILS

League Name
Pouncy Tract Weekend Pickleball League

Location
Short Pump, Virginia

Format
Doubles Round Robin

Maximum Players
30

Playoffs
Top 12 Players

--------------------------------------------------