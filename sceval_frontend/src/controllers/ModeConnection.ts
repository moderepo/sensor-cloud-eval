import modeAPI from './ModeAPI';
import { ErrorResponse, Event } from '../components/entities/API';
import { ConcreteObservable } from './Observer';

/**
 * This class is used for communicating with devices using web socket which is different from ModeAPI which is used for
 * REST API calls.
 * This is usually used for sending commands to the devices to get them to do something. For example, to get a device
 * to search for available sensor modules, you can call the "searchForSensorModules" function. Note, there is no
 * response from the server for these call. These will only send command the the device. When the device receive these
 * command, it will process the command and send the response to the web socket. So to be able to receive the response
 * from the device, you must register with ModeConnection as an observer and implement the "notify" function.
 * For example:
 *    ModeConnnection.addObserver({
 *      notify: function (event) {
 *        // handle the event
 *      }
 *    })
 */
export class ModeConnection extends ConcreteObservable<Event> {
  private webSocket: WebSocket | null;

  constructor() {
    super();
    this.webSocket = null;
    this.onMessage = this.onMessage.bind(this);
  }

  /**
   * Close the web socket connection
   */
  closeConnection() {
    if (this.webSocket !== null) {
      this.webSocket.close();
    }
  }

  /**
   * Open a web socket connection to listen to events from devices. This will only open a new connection
   * if there isn't one open already.
   */
  openConnection() {
    if (this.webSocket !== null) {
      if (this.webSocket.readyState !== WebSocket.CLOSED) {
        // WebSocket already active. Don't open a new one.
        return;
      }
    }

    const baseUrl: string = modeAPI.getBaseUrl().replace(
      /^http/,
      'ws'
    );
    const wsUrl: string = `${baseUrl}userSession/websocket?authToken=${modeAPI.getAuthToken()}`;

    this.webSocket = new WebSocket(wsUrl);
    this.webSocket.onmessage = this.onMessage;
  }

  /**
   * Send a command to the device to search for sensor modules. The result will be sent back to the client
   * through the web socket from the "discoveredSensorModules" event
   * @param deviceID
   */
  public searchForSensorModules(deviceID: number): void {
    modeAPI
      .sendCommand(deviceID, {
        action: 'startDiscovery',
        parameters: { timeout: 1000 }
      })
      .catch((error: ErrorResponse) => {
        console.error('reason', error.message);
      });
  }

  /**
   * Send a command to the device to return the list of sensor modules. The result will be returned to the
   * client through the web socket from the "sensorModuleList" event
   * @param deviceID 
   */
  public listSensorModules(deviceID: number): void {
    modeAPI
      .sendCommand(deviceID, {
        action: 'listSensorModules',
        parameters: { timeout: 1000 }
      })
      .catch((error: ErrorResponse) => {
        console.error('reason', error.message);
      });
  }

  private onMessage(messageEvent: MessageEvent) {
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
}

export default new ModeConnection();
