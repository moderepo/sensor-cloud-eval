import Axios, { Method } from 'axios';
import { AxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Home from './Home';
import moment from 'moment';
import User from './User';

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

export class MODECONSTANTS {
  public static MODE_API_BASE_URL: string = 'https://api.tinkermode.com/';
  
  public static EVENT_DEVICE_CONNECTED: string = '_deviceConnected_';
  public static EVENT_DEVICE_DISCONNECTED: string = '_deviceDisconnected_';
  public static EVENT_KEY_VALUE_SAVED: string = '_keyValueSaved_';
  public static EVENT_KEY_VALUE_DELETED: string = '_keyValueDeleted_';
  public static EVENT_DEVICE_KEY_VALUE_SAVED: string = '_deviceKVSaved_';
  public static EVENT_DEVICE_KEY_VALUE_DELETED: string = '_deviceKVDeleted_';
  
  public static ERROR_UNKNOWN_EMAIL: string = 'UNKNOWN_EMAIL';
  public static ERROR_INVALID_EMAIL: string = 'INVALID_EMAIL';
  public static ERROR_INVALID_TOKEN: string = 'INVALID_TOKEN';
  public static ERROR_INCORRECT_PASSWORD: string = 'INCORRECT_PASSWORD';
  public static ERROR_PASSWORD_TOO_SHORT: string = 'PASSWORD_TOO_SHORT';
  public static ERROR_PASSWORD_TOO_WEAK: string = 'PASSWORD_TOO_WEAK';
  public static ERROR_EXCEEDED_MAX_USERS: string = 'EXCEEDED_MAX_USERS';
  public static ERROR_USER_EXISTS_UNVERIFIED: string = 'USER_EXISTS_UNVERIFIED';
  public static ERROR_USER_EXISTS: string = 'USER_EXISTS';
  public static ERROR_USER_UNVERIFIED: string = 'USER_UNVERIFIED';

  private constructor () {}
}

export class ModeAPI {
  private baseUrl: string;
  private authToken: string;
  private axios: AxiosInstance;
  private makeHomePromise: Promise<any> | null = null;
  private defaultHome: Home | null = null;

  public static getErrReason(resp: any): string {
    if (resp.data) {
      if (resp.data.reason) {
        return resp.data.reason;
      }

      if (400 <= resp.status && resp.status <= 499) {
        return 'INVALID_INPUT';
      }

      if (500 <= resp.status && resp.status <= 599) {
        return 'SERVER_ERROR';
      }
    }

    return 'NO_CONNECTION';
  }

  /**
   * Convert any error object to a standard generic ErrorResponse object. This error object is usually an
   * AxiosError but it can be other error types.
   */
  public static getErrorResponse (error: any): ErrorResponse {
    let message: string = 'Unknown error';
    let status: number = 400;

    if (error && error.response && error.response.data) {
      if (typeof error.response.data === 'object' && error.response.data.reason) {
        message = error.response.data.reason;
      } else {
        message = error.response.data.toString();
      }
    } else if (error && error.message) {
      message = error.message;
    }

    if (error && error.response && error.response.status) {
      status = error.response.status;
    }

    return {
      message: message,
      status: status,
    };
  }

  constructor() {
    this.baseUrl = '';
    this.authToken = '';
    this.axios = Axios.create();
  }

  public getAxiosInstance() {
    return this.axios;
  }

  public getAuthToken() {
    return this.authToken;
  }

  public setAuthToken(authToken: string) {
    this.authToken = authToken;
  }

  public getBaseUrl() {
    return this.baseUrl;
  }

  public setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;

    this.axios = Axios.create({
      baseURL: baseUrl
    });
  }

  public _initRequest(method: Method, path: string, withCredentials?: boolean): RequestConfig {
    var url: string;
    if (path.indexOf('://') > -1) {
      url = path;
    } else {
      url = this.baseUrl + path;
    }
    
    const config: RequestConfig = {
      method: method,
      url: url,
      headers: {
      }
    };
    if (withCredentials !== undefined) {
      config.withCredentials = withCredentials;
    }
    if (this.authToken) {
      config.headers.Authorization = 'ModeCloud ' + this.authToken;
    }
    return config;
  }

  // Make a REST request. For POST/PUT/PATCH requests, body is encoded as JSON.
  public request<T>(method: Method, path: string, data: string | Object, withCredentials?: boolean) {
    const config: any = this._initRequest(method, `${MODECONSTANTS.MODE_API_BASE_URL}${path}`, withCredentials);
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      config.data = data;
    } else {
      if (data) {
        config.params = data;
      }
    }

    return this.axios.request<T>(config);
  }

  // Make a POST request as a web form submission.
  public postForm<T>(path: string, postData: Object) {
    const config: any = this._initRequest('POST', `${MODECONSTANTS.MODE_API_BASE_URL}${path}`, false);

    config.data = postData;
    config.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';

    // This generates form encoded body
    config.transformRequest = function(data: any, headers: any) {
      const str: Array<string> = [];
      for (const p of Object.keys(data)) {
        str.push(encodeURIComponent(p) + '=' + encodeURIComponent(data[p]));
      }
      return str.join('&');
    };

    return this.axios.request<T>(config);
  }

  /**
   * 
   * @param projectId Register a new user account
   * @param name 
   * @param email 
   * @param password 
   */
  public async registerUser (projectId: number, name: string, email: string, password: string): Promise <User> {
    try {
      const params: any = {
        projectId: projectId,
        name: name,
        email: email,
        password: password,
      };

      const response: AxiosResponse<any> = await this.request('POST', 'users', params);
      return response.data as User;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Log user in
   * @param projectId
   * @param appId 
   * @param email 
   * @param password 
   */
  public async login (projectId: number, appId: string, email: string, password: string): Promise<any> {
    try {
      const params: any = {
        projectId: projectId,
        appId: appId,
        email: email,
        password: password,
      };

      const response: AxiosResponse<any> = await this.postForm('auth/user', params);
      return response.data;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get user profile info
   */
  public async getUserInfo (userId: number): Promise<User> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `users/${userId}`, {});
      return response.data as User;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * 
   * @param userId Update user info
   * @param params Should only contain the fields and values that need to be updated, not the entire User object
   */
  public async updateUserInfo (userId: string, params: any): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request('PATCH', `users/${userId}`, params);
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Reset user password
   * @param projectId
   * @param email 
   */
  public async resetPassword (projectId: number, email: string): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'POST',
        `auth/user/passwordReset/start`,
        {
          projectId: projectId,
          email: email
        }
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getHomes(userId: number): Promise<Home[]> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `homes`, {userId: userId});
      return response.data as Home[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getHomeByHomeId(homeId: number) {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `homes/${homeId}`, {});
      return response.data as Home;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getHome(userId: number): Promise<Home> {
    if (this.defaultHome === null) {
      const homes: Home[] = await this.getHomes(userId);
      console.log('GET /homes - success');
      if (homes.length > 0) {
        // pick the first home
        this.defaultHome = homes[0];
        return homes[0];
      } else {
        // If no home, create "home" once.
        return this.makeHome();
      }
    } else {
      return this.defaultHome;
    }
  }

  public async getDevice(deviceId: number): Promise<Device> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `${deviceId}`, {});
      return response.data as Device;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getDevices(homeId: number): Promise<Device[]> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `devices`, {homeId: homeId});
      return response.data as Device[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get the home's time series info for all serties. This will only return the time series'
   * metadata data, not the actuel time series data.
   * @param homeID
   */
  public async getTSDBInfo (homeID: string): Promise<TimeSeriesInfo[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET', `homes/${homeID}/smartModules/tsdb/timeSeries`, {});
      return response.data as TimeSeriesInfo[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get time series data for the specified seriesID
   * @param homeID
   * @param seriesID 
   * @param startTime 
   * @param endTime 
   * @param aggregation 
   */
  public async getTSDBData (
      homeID: string, seriesID: string, startTime: string, endTime: string, aggregation: string = 'avg'
    ): Promise<TimeSeriesData> {

    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeID}/smartModules/tsdb/timeSeries/${seriesID}` +
        `/data?begin=${startTime}&end=${endTime}&aggregation=${aggregation}`,
        {});

      return response.data as TimeSeriesData;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * 
   * @param deviceID Get every key value store for a specific device
   */
  public async getAllDeviceKeyValueStore (deviceID: string): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `devices/${deviceID}/kv`, {});
      return response.data as KeyValueStore[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * @param deviceID Get the value of a key value store for a given key
   * @param key 
   */
  public async getDeviceKeyValueStore (deviceID: string, key: string): Promise<KeyValueStore> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET', `devices/${deviceID}/kv/${key}`, {}
      );
      return response.data as KeyValueStore;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get all the key value stores for a specific device that has keys started with the specified keyPrefix
   * @param deviceID
   * @param keyPrefix 
   */
  public async getAllDeviceKeyValueStoreByPrefix (deviceID: string, keyPrefix: string): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET', `devices/${deviceID}/kv?keyPrefix=${keyPrefix}`, {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Add/Update a key value store for a device
   * @param deviceID 
   * @param key
   * @param store 
   */
  public async setDeviceKeyValueStore (deviceID: string, key: string, store: KeyValueStore): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT', `devices/${deviceID}/kv/${key}`, {
          value: store.value
        }
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * @param deviceID Delete a key value store from a device
   * @param key 
   * @returns number response status
   */
  public async deleteDeviceKeyValueStore (deviceID: string, key: string): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'DELETE', `devices/${deviceID}/kv/${key}`, {}
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * 
   * @param homeID Get every key value store for a specific home
   */
  public async getAllHomeKeyValueStore (homeID: string): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `homes/${homeID}/kv`, {});
      return response.data as KeyValueStore[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * @param homeID Get the value of a key value store for a given key
   * @param key 
   */
  public async getHomeKeyValueStore (homeID: string, key: string): Promise<KeyValueStore> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET', `homes/${homeID}/kv/${key}`, {}
      );
      return response.data as KeyValueStore;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get all the key value stores for a specific home that has keys started with the specified keyPrefix
   * @param homeID
   * @param keyPrefix 
   */
  public async getAllHomeKeyValueStoreByPrefix (homeID: string, keyPrefix: string): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET', `homes/${homeID}/kv?keyPrefix=${keyPrefix}`, {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Add/Update a key value store for a home
   * @param homeID 
   * @param key
   * @param store 
   */
  public async setHomeKeyValueStore (homeID: string, key: string, store: KeyValueStore): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT', `homes/${homeID}/kv/${key}`, {
          value: store.value
        }
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * @param homeID Delete a key value store from a home
   * @param key 
   * @returns number response status
   */
  public async deleteHomeKeyValueStore (homeID: string, key: string): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'DELETE', `homes/${homeID}/kv/${key}`, {}
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Send a command to a device
   * @param deviceID 
   * @param params 
   */
  public async sendCommand (deviceID: string, params: any): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT', `devices/${deviceID}/command`, params
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  private makeHome() {
    if (this.makeHomePromise === null) {
      this.makeHomePromise = this.request('POST', 'homes', {name: 'home'})
        .then((response: any) => {
          console.log('POST /homes success');
          this.defaultHome = response.data;
          return response.data;
        });
    }
    
    return this.makeHomePromise;
  }
}

export default (new ModeAPI);