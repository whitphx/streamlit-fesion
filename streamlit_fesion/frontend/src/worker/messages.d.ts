interface WorkerInitialData {
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
  data: WorkerInitialData;
}
interface InputImageMessage extends InMessageBase {
  type: "inputImage";
  data: {
    imageData: ImageData
  };
}
type InMessage =
  | InitDataMessage | InputImageMessage

interface OutMessageBase {
  type: string;
  data?: unknown;
}
interface ReadyMessage {
  type: "ready",
}

type OutMessage = ReadyMessage;

/**
 * Reply message to InMessage
 */
interface ReplyMessageBase {
  type: string;
  error?: Error;
  data?: any;
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
