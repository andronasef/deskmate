/**
 * Measured from public/phone.glb (single mesh, 838 tris, obj2gltf export).
 *
 * The model lies flat: long axis on X, width on Z, thickness on Y, with the
 * front plate facing +Y. Everything below is in the model's own units; the
 * scene rotates it upright and scales it into world units.
 */
export const MODEL = {
  /** Full bounding box of the mesh. */
  length: 54.8, // X extent  -> world height
  width: 28.44, // Z extent  -> world width
  thickness: 2.77, // Y extent -> world depth
  /** The flat front plate, where the screen goes. */
  front: {
    y: 2.77, // the plate's own Y
    length: 53.44, // X extent
    width: 26.62, // Z extent
  },
} as const

/** World height of the phone. The camera path in trailer/camera.ts is tuned to this. */
export const PHONE_HEIGHT = 2.167

export const SCALE = PHONE_HEIGHT / MODEL.length

/** Bezel inset from the front plate's edge, in world units. */
const BEZEL = 0.055

export const SCREEN_HEIGHT = MODEL.front.length * SCALE - BEZEL * 2
/** Matches the ScreenContent composition (540x1170). */
export const SCREEN_ASPECT = 540 / 1170
export const SCREEN_WIDTH = SCREEN_HEIGHT * SCREEN_ASPECT
export const SCREEN_RADIUS = 0.05

/** Front plate in world Z once the model is centred on its thickness. */
export const SCREEN_Z = (MODEL.front.y - MODEL.thickness / 2) * SCALE + 0.0015
