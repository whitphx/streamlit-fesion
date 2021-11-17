import { useEffect } from "react";

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

interface UseCameraOptions {
  playing: boolean;
  videoConstraints: MediaStreamConstraints["video"];
  onFrame: (imageData: ImageData) => void | Promise<void>;
}
export const useCamera = ({
  playing,
  videoConstraints,
  onFrame,
}: UseCameraOptions) => {
  useEffect(() => {
    if (!playing) {
      return;
    }

    let unmounted = false;

    const videoElem = document.createElement("video");

    const canvasElem = document.createElement("canvas");
    const canvasCtx = canvasElem.getContext("2d"); // TODO: Check if another context type is better.

    if (canvasCtx == null) {
      throw new Error("Failed to get a canvas context.");
    }

    let lastFrameTime: number | undefined = undefined;
    const onAnimationFrame = async () => {
      if (unmounted) {
        return;
      }

      if (!videoElem.paused && videoElem.currentTime !== lastFrameTime) {
        lastFrameTime = videoElem.currentTime;

        canvasCtx.drawImage(videoElem, 0, 0);
        const imageData = canvasCtx.getImageData(
          0,
          0,
          canvasElem.width,
          canvasElem.height
        );

        await onFrame(imageData); // NOTE: Wait for the promise resolution here, but parallel execution may also be an option.
      }

      window.requestAnimationFrame(onAnimationFrame);
    };

    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      .then((_stream) => {
        if (unmounted) {
          stopStream(_stream);
          return;
        }

        stream = _stream;

        videoElem.onloadedmetadata = function () {
          if (unmounted) {
            return;
          }

          canvasElem.width = videoElem.videoWidth;
          canvasElem.height = videoElem.videoHeight;
          videoElem.play();

          window.requestAnimationFrame(onAnimationFrame);
        };

        videoElem.srcObject = stream;
      });

    return () => {
      unmounted = true;

      videoElem.pause();
      videoElem.remove();

      canvasElem.remove();

      if (stream) {
        stopStream(stream);
      }
    };
  }, [playing, videoConstraints, onFrame]);
};
