import { z } from 'zod'

/**
 * Candidate music beds. Switch between them from the props panel in
 * `remotion studio` — the `track` dropdown on the PhoneTrailer composition.
 *
 * Files live in public/music/ and are gitignored; `trailer/fetch-music.sh`
 * re-downloads them. Licences and credits are in MUSIC.md — two of the three
 * are NonCommercial, so read that before publishing.
 */
export const trackSchema = z.enum(['none', 'zabriskie', 'engel', 'bluedot'])
export type TrackId = z.infer<typeof trackSchema>

export type Track = {
  readonly file: string
  readonly title: string
  readonly artist: string
  readonly license: string
  /** Seconds into the track to start, so the trailer opens on its best 34s. */
  readonly startFromSeconds: number
}

export const TRACKS: Record<Exclude<TrackId, 'none'>, Track> = {
  zabriskie: {
    file: 'music/zabriskie.mp3',
    title: 'It Seems Like I Was Just Here',
    artist: 'Chris Zabriskie',
    license: 'CC BY 4.0',
    startFromSeconds: 0,
  },
  engel: {
    file: 'music/engel.mp3',
    title: 'Idea',
    artist: 'Kai Engel',
    license: 'CC BY-NC 3.0',
    startFromSeconds: 0,
  },
  bluedot: {
    file: 'music/bluedot.mp3',
    title: 'Camplight',
    artist: 'Blue Dot Sessions',
    license: 'CC BY-NC 4.0',
    startFromSeconds: 0,
  },
}
