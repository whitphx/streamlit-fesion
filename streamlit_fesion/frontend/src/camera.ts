import { useEffect } from "react"

interface UseCameraOptions {
  playing: boolean;
  videoConstraints: MediaStreamConstraints["video"];
  onFrame: (imageData: ImageData) => void | Promise<void>;
}
export const useCamera = ({ playing, videoConstraints, onFrame }: UseCameraOptions) => {
  useEffect(() => {
    if (!playing) {
      return;
    }

    const videoElem = document.createElement("video");

    const canvasElem = document.createElement("canvas");
    const canvasCtx = canvasElem.getContext("2d"); // TODO: Check if another context type is better.

    if (canvasCtx == null) {
      throw new Error("Failed to get a canvas context.")
    }

    let lastFrameTime: number | undefined = undefined
    const onAnimationFrame = async () => {
      if (!videoElem.paused && videoElem.currentTime !== lastFrameTime) {
        lastFrameTime = videoElem.currentTime;

        canvasCtx.drawImage(videoElem, 0, 0);
        const imageData = canvasCtx.getImageData(0, 0, canvasElem.width, canvasElem.height);

        await onFrame(imageData) // NOTE: Wait for the promise resolution here, but parallel execution may also be an option.
      }

      window.requestAnimationFrame(onAnimationFrame)
    }

    let stream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false,
    }).then((_stream) => {
      stream = _stream;

      videoElem.onloadedmetadata = function () {
        canvasElem.width = videoElem.videoWidth;
        canvasElem.height = videoElem.videoHeight;
        videoElem.play();

        window.requestAnimationFrame(onAnimationFrame)
      }

      videoElem.srcObject = stream;
    });

    return () => {
      videoElem.pause();
      videoElem.remove();

      canvasElem.remove();

      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        })
      }
    }
  }, [playing, videoConstraints, onFrame])
}
