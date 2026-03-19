Player profile phase 1 build

Included:
- Persistent player profile records
- League self-enrollment
- Admin photo update
- Protected rating updates for existing players on the public page

What changed:
- Admin can add/update photo URL for new and existing players
- League page has Player Profile Enrollment form
- Existing player ratings are protected on the League page
- Profiles now keep photoUrl / createdAt / updatedAt fields
- Refresh should not delete player profiles because roster upserts/merges are used

Files to replace:
- admin/index.html
- league/index.html
- public-data.js
