import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRenderData } from "streamlit-component-lib-react-hooks";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { useCamera } from "./camera";
import ImageDataPreview from "./ImageDataPreview";
import { setComponentValue } from "./component-value";
import { WorkerProxy } from "./worker/proxy";

const MyComponent: React.VFC = () => {
  const renderData = useRenderData();

  const imageFilterPyFuncDefCode = renderData.args["func_def_code"];
  const imageFilterPyFuncName = renderData.args["func_name"]; // TODO: Create a denied name list as a func_name, which are already used as global entity names, like `fesionImageWidth`.
  const imageFilterDepPackages: string[] =
    renderData.args["dep_packages"] ?? [];
  const imageFilterDepPackagesJson = JSON.stringify(
    imageFilterDepPackages.sort()
  ); // Serialize for memoization

  const [workerProxy, setWorkerProxy] = useState<WorkerProxy>();
  useEffect(
    () => {
      setComponentValue({ pythonError: null });

      const filterDepPackages: string[] = JSON.parse(
        imageFilterDepPackagesJson
      );

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
  useEffect(() => {
    if (workerProxy == null) {
      return;
    }

    setComponentValue({ pythonError: null });

    const filterDepPackages: string[] =
      JSON.parse(imageFilterDepPackagesJson) || [];

    workerProxy.updateFuncCode({
      funcName: imageFilterPyFuncName,
      funcDefPyCode: imageFilterPyFuncDefCode,
      requirements: filterDepPackages,
    });
  }, [
    // `workerProxy` is excluded from the deps so that this function is not called just reacting the initialization of `workerProxy`.
    imageFilterPyFuncName,
    imageFilterPyFuncDefCode,
    imageFilterDepPackagesJson,
  ]);

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
      if (workerProxy == null || !workerProxy.isLoaded) {
        setFrame(imageData);
        return;
      }

      try {
        const outImageData = await workerProxy.process(imageData);
        // Here is called asynchronously, so use ref to check the `playing` value.
        if (!playingRef.current) {
          setFrame(undefined);
          return;
        }
        setFrame(outImageData);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (
          typeof err.stack === "string" &&
          err.stack.startsWith("PythonError")
        ) {
          const serializableError = {
            stack: err.stack,
            message: err.message,
          };
          setComponentValue({ pythonError: serializableError });
        }
        setPlaying(false);
        throw err;
      }
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
        {playing && (workerProxy == null || !workerProxy.isLoaded) && (
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
