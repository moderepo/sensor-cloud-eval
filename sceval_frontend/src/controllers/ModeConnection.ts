import { default as modeAPI } from './ModeAPI';
import { ConcreteObservable } from './Observer';
import Event from './Event';
import { SensorModuleInterface } from '../components/entities/SensorModule';

const MODE_API_BASE_URL = 'https://api.tinkermode.com';
export class ModeConnection extends ConcreteObservable<Event> {
  webSocket: WebSocket | null;

  constructor() {
    super();
    this.webSocket = null;
    this.onMessage = this.onMessage.bind(this);
  }

  closeConnection() {
    if (this.webSocket !== null) {
      this.webSocket.close();
    }
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
    this.webSocket.onmessage = this.onMessage;
    return this.webSocket;
  }

  onMessage(messageEvent: MessageEvent) {
    const messageData = messageEvent.data;
    try {
      const parsedData = JSON.parse(messageData);
      this.notifyAll(parsedData);
      return parsedData;
    } catch (e) {
      console.error('Websocket message is invalid JSON:', messageData);
      return;
    }
  }

  startSensor(home: any, sensor: any, deviceID: string): void {
    const enableURL = MODE_API_BASE_URL + '/homes/' + home.id + '/kv/' + sensor.sensorModuleId;
    const cmd = {
      value: {
        gatewayID: deviceID,
        id: sensor.modelSpecificId,
        interval: 15,
        modelId: sensor.modelId,
        note: home.name,
        sensing: 'on',
        sensors: sensor.moduleSchema
      }
    };
    modeAPI.request('PUT', enableURL, cmd)
                    .then((response: any) => {
                      console.log(response);
                      return response;
                    }).catch((reason: any) => {
                      console.error('reason', reason);
                    });
  }

  getSensorData(deviceID: string): void {
    const url = MODE_API_BASE_URL + '/devices/' + deviceID + '/command';
    const cmd = {
      action: 'timeSeriesData',
    };

    modeAPI.request('PUT', url, cmd)
                    .then((response: any) => {
                      console.log(response);
                      return response;
                    }).catch((reason: any) => {
                      console.error('reason', reason);
                    });
  }

  searchForSensorModules(deviceID: string): void {
    const url = MODE_API_BASE_URL + '/devices/' + deviceID + '/command';
    const cmd = {
      action: 'startDiscovery',
      parameters: { timeout: 1000 }
    };

    modeAPI.request('PUT', url, cmd)
                    .then((response: any) => {
                      return response;
                    }).catch((reason: any) => {
                      console.error('reason', reason);
                    });
  }

  listSensorModules(deviceID: string): void {
    console.log(deviceID);
    const url = MODE_API_BASE_URL + '/devices/' + deviceID + '/command';
    const cmd = {
      action: 'listSensorModules',
      parameters: { timeout: 1000 }
    };

    modeAPI.request('PUT', url, cmd)
                    .then((response: any) => {
                      console.log(response);
                      return response;
                    }).catch((reason: any) => {
                      console.error('reason', reason);
                    });
  }

  getConnection() {
    return this.webSocket;
  }
}

export default new ModeConnection;