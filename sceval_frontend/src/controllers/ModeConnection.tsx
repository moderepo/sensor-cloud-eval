import { default as modeAPI } from './ModeAPI';
import { ConcreteObservable } from './Observer';
import Event from './Event';
import Axios from 'axios';

const MODE_API_BASE_URL = 'https://api.tinkermode.com';
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

    const apiUrl = MODE_API_BASE_URL + '/userSession/websocket?authToken=' + modeAPI.getAuthToken();
    const wsUrl = apiUrl.replace(/^http/, 'ws');

    this.webSocket = new WebSocket(wsUrl);
    console.log(this.webSocket);
    this.webSocket.onmessage = this.onMessage;
  }

  onMessage(messageEvent: MessageEvent) {
    const messageData = messageEvent.data;

    try {
      const parsedData = JSON.parse(messageData);
      this.notifyAll(parsedData);
      console.log(parsedData);
    } catch (e) {
      console.error('Websocket message is invalid JSON:', messageData);
      return;
    }
  }

  searchForSensorModules(deviceID: string): void {
    modeAPI.request('PUT', MODE_API_BASE_URL + '/devices/' + deviceID + '/command',
                    { action: 'startDiscovery',
                      parameters: {
                        timeout: 10000
                    }
                  }, 
                    true)
                    .then((response: any) => {
                      return response;
                    }).catch((reason: any) => {
                      console.log(reason);
                    });
  }
  getConnection() {
    return this.webSocket;
  }
}

export default new ModeConnection;