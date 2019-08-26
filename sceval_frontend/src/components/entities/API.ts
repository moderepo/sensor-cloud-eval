import { AxiosRequestConfig } from 'axios';

export interface RequestConfig extends AxiosRequestConfig {
}

export interface Device {
  id: number;
  isConnected: boolean;
  lastConnectTime: string;
  name?: string;
  deviceClass: string;
}

export interface KeyValueStore {
  key: string;
  modificationTime?: string;
  value: any;
}

export interface TimeSeriesInfo {
  homeId: number;
  id: string;
  moduleId: string;
}

export interface TimeSeriesData {
  seriesId: string;
  aggregation: string;
  begin: string;
  end: string;
  resolution: string;
  data: [][];
}

export interface ErrorResponse {
  message: string;
  status: number;
}