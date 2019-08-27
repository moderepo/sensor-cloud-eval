export namespace Constants {
  export const SENSOR_MODULE_KEY_PREFIX: string = 'sensorModule';

  export const EVENT_SENSOR_MODULE_LIST: string = 'sensorModuleList';
  export const EVENT_SENSOR_MODULE_UNREGISTERED: string =
    'sensorModuleUnregistered';
  export const EVENT_SENSOR_MODULE_STATE_CHANGE: string =
    'sensorModuleStateChange';
  export const EVENT_DISCOVERED_SENSOR_MODULES: string =
    'discoveredSensorModules';
  export const EVENT_REALTIME_DATA: string = 'realtimeData';
  export const EVENT_TIME_SERIES_DATA: string = 'timeSeriesData';

  export const ERROR_USER_NOT_FOUND: string = 'USER_NOT_FOUND';
  export const ERROR_CONNECTION_ERROR: string = 'CONNECTION_ERROR';
  export const ERROR_LOGIN_CREDENTIALS_NOT_PRESENT: string =
    'LOGIN_CREDENTIALS_NOT_PRESENT';
}
