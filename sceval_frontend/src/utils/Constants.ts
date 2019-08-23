
export class CONSTANTS {
  public static SENSOR_MODULE_KEY_PREFIX: string = 'sensorModule';

  public static EVENT_SENSOR_MODULE_LIST: string = 'sensorModuleList';
  public static EVENT_SENSOR_MODULE_UNREGISTERED: string = 'sensorModuleUnregistered';
  public static EVENT_SENSOR_MODULE_STATE_CHANGE: string = 'sensorModuleStateChange';
  public static EVENT_DISCOVERED_SENSOR_MODULES: string = 'discoveredSensorModules';
  public static EVENT_REALTIME_DATA: string = 'realtimeData';
  public static EVENT_TIME_SERIES_DATA: string = 'timeSeriesData';

  /**
   * Make private so no one can create an instant
   */
  private constructor () {
  }
}
