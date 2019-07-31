import { default as modeAPI } from './ModeAPI';
import { ConcreteObservable } from './Observer';
import Event from './Event';

export class ModeConnection extends ConcreteObservable<Event> {
  webSocket: WebSocket | null;

  constructor() {
    super();
    this.webSocket = null;
    this.onMessage = this.onMessage.bind(this);
  }

  openConnection() {
    if (this.webSocket !== null) {
      if (this.webSocket.readyState !== WebSocket.CLOSED) {
        // WebSocket already active. Don't open a new one.
        return;
      }
    }

    const apiUrl = modeAPI.getBaseUrl() + '/userSession/websocket?authToken=' + modeAPI.getAuthToken();
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    this.webSocket = new WebSocket(wsUrl);
    this.webSocket.onmessage = this.onMessage;
  }

  onMessage(messageEvent: MessageEvent) {
    const messageData = messageEvent.data;

    try {
      const parsedData = JSON.parse(messageData);
      this.notifyAll(parsedData);
    } catch (e) {
      console.error('Websocket message is invalid JSON:', messageData);
      return;
    }
  }

  getConnection() {
    return this.webSocket;
  }
}

export default new ModeConnection;