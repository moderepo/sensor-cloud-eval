export const MODE_API_BASE_URL: string = 'https://api.tinkermode.com/';
  
/**
 * This is the list of all the event types for the events that come from web socket
 */
export const EVENT_DEVICE_CONNECTED: string = '_deviceConnected_';
export const EVENT_DEVICE_DISCONNECTED: string = '_deviceDisconnected_';
export const EVENT_KEY_VALUE_SAVED: string = '_keyValueSaved_';
export const EVENT_KEY_VALUE_DELETED: string = '_keyValueDeleted_';
export const EVENT_DEVICE_KEY_VALUE_SAVED: string = '_deviceKVSaved_';
export const EVENT_DEVICE_KEY_VALUE_DELETED: string = '_deviceKVDeleted_';

/**
 * These are the errors that can be returned when API call failed
 */
export const ERROR_UNKNOWN_EMAIL: string = 'UNKNOWN_EMAIL';
export const ERROR_INVALID_EMAIL: string = 'INVALID_EMAIL';
export const ERROR_INVALID_TOKEN: string = 'INVALID_TOKEN';
export const ERROR_INCORRECT_PASSWORD: string = 'INCORRECT_PASSWORD';
export const ERROR_PASSWORD_TOO_SHORT: string = 'PASSWORD_TOO_SHORT';
export const ERROR_PASSWORD_TOO_WEAK: string = 'PASSWORD_TOO_WEAK';
export const ERROR_EXCEEDED_MAX_USERS: string = 'EXCEEDED_MAX_USERS';
export const ERROR_USER_EXISTS_UNVERIFIED: string = 'USER_EXISTS_UNVERIFIED';
export const ERROR_USER_EXISTS: string = 'USER_EXISTS';
export const ERROR_USER_UNVERIFIED: string = 'USER_UNVERIFIED';

export const TS_AGGREGATION_MIN: string = 'min';
export const TS_AGGREGATION_MAX: string = 'max';
export const TS_AGGREGATION_AVG: string = 'avg';
export const TS_AGGREGATION_COUNT: string = 'count';
export const TS_AGGREGATION_SUM: string = 'sum';
