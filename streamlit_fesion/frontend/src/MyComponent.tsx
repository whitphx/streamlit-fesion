import React, { useState, useCallback } from "react"
import { useCamera } from "./camera"

const MyComponent: React.VFC = () => {
  const [playing, setPlaying] = useState(false)
  const togglePlaying = useCallback(() => setPlaying((cur) => !cur), [])

  const onFrame = useCallback((imageData: ImageData) => {
    console.log("onFrame", imageData)
  }, [])

  useCamera({
    playing,
    videoConstraints: true,
    onFrame,
  })

  return (
    <div>
      <button onClick={togglePlaying}>{playing ? "Stop" : "Play"}</button>
    </div>
  )
}

export default MyComponent
