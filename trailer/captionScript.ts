export type Caption = {
  readonly from: number
  readonly to: number
  readonly text: string
}

/**
 * The pitch. This is the only file to touch when rewording it.
 * Frames are absolute within the 900-frame composition.
 */
export const CAPTIONS: readonly Caption[] = [
  { from: 20, to: 85, text: 'That old phone in the drawer.' },
  { from: 155, to: 215, text: 'Give it a second life.' },
  { from: 375, to: 435, text: 'A focus timer.' },
  { from: 555, to: 615, text: 'Live data at a glance.' },
  { from: 700, to: 760, text: 'Widgets you pick — or write.' },
  { from: 775, to: 835, text: 'No install. Just a link.' },
  { from: 872, to: 952, text: 'Or your desktop start page.' },
]

/** The end card owns the frame after this. */
export const END_CARD_FROM = 965
