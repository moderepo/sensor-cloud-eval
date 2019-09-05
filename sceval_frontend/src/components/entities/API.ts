import { AxiosRequestConfig } from 'axios';
export interface RequestConfig extends AxiosRequestConfig {
}
export interface Device {
  // device id
  id: number;
  // connected status
  isConnected: boolean;
  // last time connected
  lastConnectTime: string;
  // device name
  name?: string;
  // device class
  deviceClass: string;
}
export interface KeyValueStore {
  // key
  key: string;
  // modification time
  modificationTime?: string;
  // value
  value: any;
}
export interface TimeSeriesInfo {
  // home id
  homeId: number;
  // time series id
  id: string;
  // module id
  moduleId: string;
}
export interface TimeSeriesBounds {
  // The date/time of the very first series data
  begin: string;
  // The date/time of the very last series data
  end: string;
  // time series id
  seriesId: string;
}
export interface TimeSeriesData {
  // time series id (sensor type)
  seriesId: string;
  // aggregation
  aggregation: string;
  // beginning time
  begin: string;
  // ending time
  end: string;
  // resolution of data
  resolution: string;
  // data, a double Array. Each element is an array of 2 elements, date and value
  data: Array<Array<any>>;
}
export interface ErrorResponse {
  // error message
  message: string;
  // error status
  status: number;
}
export interface Observer<T> {
  // notify method
  notify(obj: T): void;
}
export interface Observable<T> {
  // event listener method
  addObserver(o: Observer<T>): void;
  // remove event listener method
  removeObserver(o: Observer<T>): void;
  // method to notify all event listeners
  notifyAll(obj: T): void;
}
export interface Event {
  // event type
  eventType: string;
  // event data
  eventData: any;
  // event timestamp
  timestamp: string;
  // home id associated with event
  homeId: number;
  // origin device id associated with event
  originDeviceId: number;
  // origin device class associated with event
  originDeviceClass: string;
  // origin device ip associated with event
  originDeviceIp: string;
  // origin project id associated with event
  originProjectKeyId: string;
  // origin project name associated with event
  originProjectKeyName: string;
}
export interface Home {
  // home creation time
  creationTime: string;
  // home id
  id: number;
  // home name
  name: string;
  // home project id
  projectId: number;
}
