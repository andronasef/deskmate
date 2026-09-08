# Trailer music candidates

Three CC-licensed tracks, switchable from the `track` prop on the
`PhoneTrailer` composition in `remotion studio` (a dropdown: `none` /
`zabriskie` / `engel` / `bluedot`). Files live in `public/music/`
(gitignored) — run `trailer/fetch-music.sh` to re-download them.

| id | Track | Artist | License | Source |
|---|---|---|---|---|
| `zabriskie` | It Seems Like I Was Just Here (from *The Black Hole*) | Chris Zabriskie | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | https://archive.org/details/cz-blackhole |
| `engel` | Idea (from *Idea*) | Kai Engel | [CC BY-NC 3.0](https://creativecommons.org/licenses/by-nc/3.0/) | https://archive.org/details/jamendo-180180 |
| `bluedot` | Camplight (from *Makropulos*) | Blue Dot Sessions | [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) | https://archive.org/details/blue-dot-sessions-makropulos |

**Before publishing anywhere commercial:** `engel` and `bluedot` are
NonCommercial licences — fine for an open-source project trailer, not fine if
DeskMate ever monetises without separately licensing them. `zabriskie` is
plain CC BY and has no such restriction. Whichever you ship, credit the
artist and link the licence (e.g. in the video description and this repo's
README).

## Sync map (all three were picked/trimmed to this shape)

| Frame | Time | Beat |
|---|---|---|
| 0–90 | 0–3s | Quiet, low. |
| 90 | 3s | The one hit — LED ignition. |
| 90–720 | 3–24s | Holds, no development. |
| 720–840 | 24–28s | Ducks under the tight camera push. |
| 840–960 | 28–32s | Lifts slightly for the desktop reveal. |
| 960–1020 | 32–34s | Fades to silence on the end card. |

The envelope is coded once in `trailer/AudioBed.tsx` and applies to whichever
track is selected, so switching tracks in the studio never needs re-tuning.
