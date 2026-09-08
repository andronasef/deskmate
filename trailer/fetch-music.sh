#!/usr/bin/env sh
# Re-download the candidate music beds into public/music/ (gitignored).
# Licences and attribution: see MUSIC.md.
set -e
mkdir -p public/music

dl() { curl -fL --retry 3 -o "public/music/$1" "$2"; echo "  $1"; }

echo "Fetching trailer music..."
dl zabriskie.mp3 "https://archive.org/download/cz-blackhole/04%20-%20It%20Seems%20Like%20I%20Was%20Just%20Here.mp3"
dl engel.mp3     "https://archive.org/download/jamendo-180180/01-1586190-Kai%20Engel-Idea.mp3"
dl bluedot.mp3   "https://archive.org/download/blue-dot-sessions-makropulos/01%20-%20Camplight.mp3"
echo "Done."
