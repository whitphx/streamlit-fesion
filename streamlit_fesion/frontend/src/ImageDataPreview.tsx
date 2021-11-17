import React, { useEffect, useRef } from "react";
import { Streamlit } from "streamlit-component-lib";

interface ImageDataPreviewProps {
  imageData: ImageData;
}
const ImageDataPreview: React.VFC<ImageDataPreviewProps> = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const imageData = props.imageData;

  // Size adjustment
  useEffect(() => {
    if (canvasRef.current == null) {
      return;
    }

    const canvasElem = canvasRef.current;
    canvasElem.width = imageData.width;
    canvasElem.height = imageData.height;

    Streamlit.setFrameHeight();
    return () => {
      Streamlit.setFrameHeight();
    };
  }, [imageData.width, imageData.height]);

  // Draw canvas
  useEffect(() => {
    if (canvasRef.current == null) {
      return;
    }

    const canvasElem = canvasRef.current;
    const ctx = canvasElem.getContext("2d");
    ctx?.putImageData(imageData, 0, 0);
  }, [imageData]);

  return <canvas ref={canvasRef} />;
};

export default ImageDataPreview;
