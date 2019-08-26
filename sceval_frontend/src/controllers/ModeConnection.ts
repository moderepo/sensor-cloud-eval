import modeAPI, { ModeConstants, ErrorResponse, KeyValueStore } from './ModeAPI';
import { ConcreteObservable } from './Observer';
import Event from './Event';

export class ModeConnection extends ConcreteObservable<Event> {
  private webSocket: WebSocket | null;

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

    const baseUrl: string = ModeConstants.MODE_API_BASE_URL.replace(/^http/, 'ws');
    const wsUrl: string = `${baseUrl}userSession/websocket?authToken=${modeAPI.getAuthToken()}`;

    this.webSocket = new WebSocket(wsUrl);
    this.webSocket.onmessage = this.onMessage;
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

  startSensor(home: any, sensor: any, deviceID: number): void {
    // TODO - Check if these info should be passed into this function instead and this function might not be neccessary
    const store: KeyValueStore = {
      key: `sensorModule${sensor.modelSpecificId}`,
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

    modeAPI.setHomeKeyValueStore(home.id, sensor.sensorModuleId, store)
    .catch ((error: ErrorResponse): void => {
      console.error('reason', error.message);
    });
  }

  getSensorTSData(deviceID: number): void {
    modeAPI.sendCommand(deviceID, {
      action: 'timeSeriesData',
    }).catch((error: ErrorResponse) => {
      console.error('reason', error.message);
    });
  }

  searchForSensorModules(deviceID: number): void {
    modeAPI.sendCommand(deviceID, {
      action: 'startDiscovery',
      parameters: { timeout: 1000 }
    }).catch((error: ErrorResponse) => {
      console.error('reason', error.message);
    });
  }

  listSensorModules(deviceID: number): void {
    modeAPI.sendCommand(deviceID, {
      action: 'listSensorModules',
      parameters: { timeout: 1000 }
    }).catch((error: ErrorResponse) => {
      console.error('reason', error.message);
    });
  }
}

export default new ModeConnection;