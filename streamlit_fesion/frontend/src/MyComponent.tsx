import React, { useState, useCallback, useEffect } from "react"
import { useCamera } from "./camera"
import { usePyodide } from "./PyodideProvider"
import ImageDataPreview from "./ImageDataPreview"

const MyComponent: React.VFC = () => {
  const [playing, setPlaying] = useState(false)

  const play = useCallback(() => setPlaying(true), [])
  const stop = useCallback(() => {
    setPlaying(false)
    setFrame(undefined)
  }, [])

  const [frame, setFrame] = useState<ImageData>()

  const onFrame = useCallback((imageData: ImageData) => {
    console.log("onFrame", imageData)
    setFrame(imageData)
  }, [])

  useCamera({
    playing,
    videoConstraints: true,
    onFrame,
  })

  const pyodide = usePyodide()
  useEffect(() => {
    if (pyodide == null) {
      return
    }

    console.log(pyodide.runPython("1 + 2")) // XXX: Sample
  }, [pyodide])

  return (
    <div>
      <div>{frame && <ImageDataPreview imageData={frame} />}</div>
      <div>
        {playing ? (
          <button onClick={stop}>Stop</button>
        ) : (
          <button onClick={play}>Play</button>
        )}
      </div>
    </div>
  )
}

export default MyComponent
