import { nanoid } from 'nanoid';

import { SetupConst } from './constants';
import {
  RequestMessage,
  ResponseMessage,
  MessageHandler,
  RequestAction,
  EventAction,
  MeetingInfo,
  SnInfo,
} from './types';

export class VCRServiceAPI {
  private port1: MessagePort | null = null;
  private port2: MessagePort | null = null;
  private isConnected: boolean = false;
  private eventListeners: Map<string, (event: MessageEvent) => void> =
    new Map();

  constructor() {
    const { port1, port2 } = new MessageChannel();
    this.port1 = port1;
    this.port2 = port2;

    this.port1.start();
  }

  private transferPortToChime(chimeId: string) {
    if (this.isConnected) return;

    const chimeIframeElement = document.getElementById(
      chimeId,
    ) as HTMLIFrameElement;

    if (!chimeIframeElement || !this.port2) return;
    chimeIframeElement.contentWindow?.postMessage(
      SetupConst.ContainerSendPort,
      '*',
      [this.port2],
    );
    this.isConnected = true;
  }

  // add event listener for chime setup
  public init = (chimeId: string) => {
    const setupHandler = (event: MessageEvent) => {
      switch (event.data) {
        case SetupConst.ChimeMounted:
          this.transferPortToChime(chimeId);
          break;
        case SetupConst.ChimeReceivePort:
          window.removeEventListener('message', setupHandler);
        default:
          break;
      }
    };

    window.addEventListener('message', setupHandler);
  };

  // add event message handler
  public addEventMessageHandler = (
    action: EventAction,
    handler: MessageHandler,
  ): string => {
    if (!this.port1) {
      throw new Error(
        '[VCR API] Internal Error: MessagePort is not initialized.',
      );
    }

    const handlerId = nanoid();
    const messageHandler = (e: MessageEvent) => {
      if (e.data.action !== action) return;
      handler(e);
    };

    this.eventListeners.set(handlerId, messageHandler);
    this.port1.addEventListener('message', messageHandler);

    return handlerId;
  };

  public removeEventMessageHandler = (handlerId: string) => {
    if (!this.port1) {
      throw new Error(
        '[VCR API] Internal Error: MessagePort is not initialized.',
      );
    }

    const handler = this.eventListeners.get(handlerId);
    if (!handler) {
      console.warn(`[VCR API] No handler found with ID "${handlerId}"`);
      return;
    }

    this.port1.removeEventListener('message', handler);
    this.eventListeners.delete(handlerId);
  };

  // send request
  private sendRequest<Payload = any>(action: RequestAction): Promise<Payload> {
    console.log('[mari] VCR API / send request', action);

    return new Promise((resolve, reject) => {
      if (!this.port1) {
        reject(
          new Error(
            '[VCR API] Internal Error: MessagePort is not initialized.',
          ),
        );
        return;
      }

      const messageId = nanoid();

      const handleResponse = (event: MessageEvent) => {
        const response = event.data as ResponseMessage;
        if (response.id !== messageId || response.messageType !== 'RESPONSE') {
          return;
        }

        this.port1?.removeEventListener('message', handleResponse);

        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.payload);
        }
      };

      const request: RequestMessage = {
        id: messageId,
        messageType: 'REQUEST',
        from: 'EXTERNAL',
        to: 'CORE',
        action,
      };

      this.port1.addEventListener('message', handleResponse);
      this.port1.postMessage(request);

      const timeoutDuration = 5000;
      const timeoutError = new Error(
        '[VCR API] Internal Error: Request timeout.',
      );
      setTimeout(() => {
        this.port1?.removeEventListener('message', handleResponse);
        reject(timeoutError);
      }, timeoutDuration);
    });
  }

  public toggleTimer = async () =>
    this.sendRequest<boolean>(RequestAction.ToggleTimer);

  public toggleRoster = async () =>
    this.sendRequest<boolean>(RequestAction.ToggleRoster);

  public toggleChat = async () =>
    this.sendRequest<boolean>(RequestAction.ToggleChat);

  public toggleMaterial = () =>
    this.sendRequest<boolean>(RequestAction.ToggleMaterial);

  public toggleLayout = () =>
    this.sendRequest<'Featured' | 'Gallery'>(RequestAction.ToggleLayout);

  public toggleMediaCapture = () =>
    this.sendRequest<boolean>(RequestAction.ToggleMediaCapture);

  public toggleNetworkMetrics = () =>
    this.sendRequest<boolean>(RequestAction.ToggleNetworkMetrics);

  public getMeetingInfo = () =>
    this.sendRequest<MeetingInfo>(RequestAction.GetMeetingInfo);

  public getSnInfo = () => this.sendRequest<SnInfo>(RequestAction.GetSnInfo);

  public leaveMeeting = () =>
    this.sendRequest<boolean>(RequestAction.LeaveMeeting);
}
