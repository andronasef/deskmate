import { Config } from '@remotion/cli/config'

// Three.js needs a real GL backend; Remotion 4 defaults to `null`.
// Use --gl=swangle on a machine without a GPU.
Config.setChromiumOpenGlRenderer('angle')
Config.setVideoImageFormat('jpeg')
