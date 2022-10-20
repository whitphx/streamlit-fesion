import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRenderData } from "streamlit-component-lib-react-hooks";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useCamera } from "./camera";
import ImageDataPreview from "./ImageDataPreview";
import { WorkerProxy } from "./worker/proxy";

const MyComponent: React.VFC = () => {
  const renderData = useRenderData();

  const imageFilterPyFuncDefCode = renderData.args["func_def_code"];
  const imageFilterPyFuncName = renderData.args["func_name"]; // TODO: Create a denied name list as a func_name, which are already used as global entity names, like `fesionImageWidth`.
  const iamgeFilterDepPackages: string[] | null =
    renderData.args["dep_packages"];
  const imageFilterDepPackagesJson = JSON.stringify(iamgeFilterDepPackages); // Serialize for memoization

  const [workerProxy, setWorkerProxy] = useState<WorkerProxy>();
  useEffect(
    () => {
      const filterDepPackages: string[] =
        JSON.parse(imageFilterDepPackagesJson) || [];

      const workerProxy = new WorkerProxy({
        funcName: imageFilterPyFuncName,
        funcDefPyCode: imageFilterPyFuncDefCode,
        requirements: filterDepPackages,
      });

      setWorkerProxy(workerProxy);
    },
    [
      // No deps because workerProxy should not be re-created.
    ]
  );

  const [frame, setFrame] = useState<ImageData>();

  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => setPlaying(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setFrame(undefined);
  }, []);

  const playingRef = useRef(false);
  playingRef.current = playing;
  const onFrame = useCallback(
    async (imageData: ImageData) => {
      if (workerProxy == null) {
        console.log("Worker has not been loaded.");
        setFrame(imageData);
        return;
      }
      const outImageData = await workerProxy.process(imageData);

      // Here is called asynchronously, so use ref to check the `playing` value.
      if (!playingRef.current) {
        setFrame(undefined);
        return;
      }
      setFrame(outImageData);
    },
    [workerProxy]
  );

  useCamera({
    playing,
    videoConstraints: true,
    onFrame,
  });

  return (
    <Box>
      <Box position="relative" display="inline-block">
        {playing && workerProxy == null && (
          <Box
            position="absolute"
            top={0}
            left={0}
            width="100%"
            height="100%"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <CircularProgress size={80} />
          </Box>
        )}
        <Box>{frame && <ImageDataPreview imageData={frame} />}</Box>
      </Box>
      <Box>
        {playing ? (
          <Button variant="contained" onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button variant="contained" onClick={play}>
            Play
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default MyComponent;
