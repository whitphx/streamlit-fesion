interface FilterFuncConfig {
  funcName: string;
  funcDefPyCode: string;
  requirements: string[];
}

/**
 * Input messages from kernel to worker
 */
interface InMessageBase {
  type: string;
  data?: unknown;
}
interface InitDataMessage extends InMessageBase {
  type: "initData";
  data: FilterFuncConfig;
}
interface InputImageMessage extends InMessageBase {
  type: "inputImage";
  data: {
    imageData: ImageData;
  };
}
interface UpdateFilterFuncMessage extends InMessageBase {
  type: "updateFilterFunc";
  data: FilterFuncConfig;
}
type InMessage = InitDataMessage | InputImageMessage | UpdateFilterFuncMessage;

interface OutMessageBase {
  type: string;
  data?: unknown;
}
// Indicates the worker process is ready to receive the messages from the main thread.
interface ReadyMessage {
  type: "ready";
}
// Indicates the Pyodide environment and the initial code are loaded.
interface LoadedMessage {
  type: "loaded";
}

type OutMessage = ReadyMessage | LoadedMessage;

/**
 * Reply message to InMessage
 */
interface ReplyMessageBase {
  type: string;
  error?: Error;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
interface OutputImageMessage extends ReplyMessageBase {
  type: "outputImage";
  data: {
    imageData: ImageData;
  };
}
interface GeneralReplyMessage extends ReplyMessageBase {
  type: "reply";
  error?: Error;
}
type ReplyMessage = OutputImageMessage | GeneralReplyMessage;
