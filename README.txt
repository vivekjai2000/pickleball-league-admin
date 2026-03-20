Photo upload safe fix

What was likely happening:
- uploaded photos were being stored as large base64 strings
- that could make sync or rendering unstable
- on admin, leaving rating blank for an existing player could also overwrite the rating with 0

This patch:
- compresses uploaded photos more aggressively
- blocks still-too-large images
- preserves existing rating when admin updates only the photo
- shows proper sync success/failure in admin after photo update
- sanitizes oversized photo URLs on the league page so rendering does not break

Replace:
- admin/index.html
- league/index.html
