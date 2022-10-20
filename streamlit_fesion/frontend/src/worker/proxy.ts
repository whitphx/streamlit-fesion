import Worker from "./fesion.worker";

interface WorkerProxyOptions {
  funcName: string;
  funcDefPyCode: string;
  requirements: string[];
}

export class WorkerProxy {
  private worker: Worker;
  private workerInitialData: FilterFuncConfig;

  private _isLoaded: boolean;
  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  public constructor(options: WorkerProxyOptions) {
    this.workerInitialData = {
      funcName: options.funcName,
      funcDefPyCode: options.funcDefPyCode,
      requirements: options.requirements,
    };
    this._isLoaded = false;

    this.worker = new Worker();
    this.worker.onmessage = (e) => {
      this._processWorkerMessage(e.data);
    };
  }

  private _processWorkerMessage(msg: OutMessage): void {
    switch (msg.type) {
      case "ready": {
        this.postInitialData();
        break;
      }
      case "loaded": {
        this._isLoaded = true;
      }
    }
  }

  private postInitialData() {
    const initDataMessage: InitDataMessage = {
      type: "initData",
      data: this.workerInitialData,
    };
    this.worker.postMessage(initDataMessage);
  }

  private _asyncPostMessage(
    message: InMessage
  ): Promise<GeneralReplyMessage["data"]>;
  private _asyncPostMessage<T extends ReplyMessage["type"]>(
    message: InMessage,
    expectedReplyType: T
  ): Promise<Extract<ReplyMessage, { type: T }>["data"]>;
  private _asyncPostMessage(
    message: InMessage,
    expectedReplyType = "reply"
  ): Promise<ReplyMessage["data"]> {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();

      channel.port1.onmessage = (e: MessageEvent<ReplyMessage>) => {
        channel.port1.close();
        const msg = e.data;
        if (msg.error) {
          reject(msg.error);
        } else {
          if (msg.type !== expectedReplyType) {
            throw new Error(`Unexpected reply type "${msg.type}"`);
          }
          resolve(msg.data);
        }
      };

      this.worker.postMessage(message, [channel.port2]);
    });
  }

  public process(imageData: ImageData): Promise<ImageData> {
    if (!this._isLoaded) {
      console.debug("Worker is not loaded");
      return Promise.resolve(imageData);
    }

    return this._asyncPostMessage(
      {
        type: "inputImage",
        data: {
          imageData,
        },
      },
      "outputImage"
    ).then((data) => {
      return data.imageData;
    });
  }

  public updateFuncCode(filterFuncConfig: FilterFuncConfig): Promise<void> {
    return this._asyncPostMessage({
      type: "updateFilterFunc",
      data: filterFuncConfig,
    });
  }
}
