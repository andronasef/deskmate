import { useEffect, useState } from 'react'
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion'

import '@fontsource/vt323'
import '@fontsource/press-start-2p'
import './screen.css'
import './desktop.css'

import { Clock } from './Clock'
import { GithubPulse } from './GithubPulse'
import { Pomodoro } from './Pomodoro'

/** Matches DESKTOP_FROM in trailer/three/Desktop.tsx. */
const BEAT_FROM = 840

/**
 * DeskMate as a browser start page: real chrome, then the multi-widget grid the
 * desktop layout actually renders. Same widgets and same CSS as the phone pass.
 */
export const DesktopContent: React.FC = () => {
  const frame = useCurrentFrame()
  const [handle] = useState(() => delayRender('fonts'))

  useEffect(() => {
    document.fonts.ready.then(() => continueRender(handle))
  }, [handle])

  // The widgets' own scenes are long past by the time this beat plays, so
  // replay them from the top rather than showing three frozen end states.
  const beat = Math.max(0, frame - BEAT_FROM)

  return (
    <AbsoluteFill className="browser">
      <div className="chrome">
        <div className="lights">
          <span /> <span /> <span />
        </div>
        <div className="tab">DeskMate</div>
        <div className="omnibox">Search or enter address</div>
      </div>

      <div className="matrix desk">
        <div className="deskGrid">
          <div className="panel deskCell" data-widget-type="clock">
            <Clock />
          </div>
          <div className="panel deskCell" data-widget-type="pomodoro">
            <Pomodoro secondsOverride={1500 - beat * 4} />
          </div>
          <div className="panel deskCell" data-widget-type="github-pulse">
            <GithubPulse sampleFrame={545 + beat} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
