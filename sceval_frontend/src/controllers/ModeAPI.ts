import Axios, { Method } from 'axios';
import { AxiosInstance, AxiosResponse } from 'axios';
import {
  RequestConfig,
  Device,
  KeyValueStore,
  TimeSeriesData,
  TimeSeriesInfo,
  ErrorResponse
} from '../components/entities/API';
import { Home } from '../components/entities/API';
import { User } from '../components/entities/User';

export namespace ModeConstants {
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
}

export class ModeAPI {
  private static instance: ModeAPI;

  private baseUrl: string;
  private authToken: string;
  private axios: AxiosInstance;
  private makeHomePromise: Promise<any> | null = null;
  private defaultHome: Home | null = null;

  public static getInstance (): ModeAPI {
    if (!ModeAPI.instance) {
      ModeAPI.instance = new ModeAPI();
    }
    return ModeAPI.instance;
  }

  public getAuthToken() {
    return this.authToken;
  }

  /**
   * Set the auth token which the backend will use for authenticating the user each time
   * an API is called. This token will be sent along with the request for each call.
   * To get this token, the user need to call "login" with the required params. If login
   * is successful, the token will be returned with the response.
   * @param authToken 
   */
  public setAuthToken(authToken: string) {
    this.authToken = authToken;
  }

  /**
   * Get the base URL for mode rest API call
   */
  public getBaseUrl() {
    return this.baseUrl;
  }

  /**
   * Change the default base URL.
   * @param baseUrl 
   */
  public setBaseUrl(baseUrl: string) {
    this.baseUrl = baseUrl;

    this.axios = Axios.create({
      baseURL: baseUrl
    });
  }

  /**
   * Register a new user account
   * @param projectId
   * @param name
   * @param email
   * @param password
   */
  public async registerUser(
    projectId: number,
    name: string,
    email: string,
    password: string
  ): Promise<User> {
    try {
      const params: any = {
        projectId: projectId,
        name: name,
        email: email,
        password: password
      };

      const response: AxiosResponse<any> = await this.request(
        'POST',
        'users',
        params
      );
      return response.data as User;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Log user in
   * @param projectId
   * @param appId
   * @param email
   * @param password
   */
  public async login(
    projectId: number,
    appId: string,
    email: string,
    password: string
  ): Promise<any> {
    try {
      const params: any = {
        projectId: projectId,
        appId: appId,
        email: email,
        password: password
      };

      const response: AxiosResponse<any> = await this.postForm(
        'auth/user',
        params
      );

      return response.data;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Log the user out
   */
  public async logout(): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'DELETE',
        `userSession`,
        {}
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get user profile info
   */
  public async getUserInfo(userId: number): Promise<User> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `users/${userId}`,
        {}
      );
      return response.data as User;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Update user info
   * @param userId
   * @param params - Params should only contain fields/values that need to be updated, not the entire User object
   */
  public async updateUserInfo(userId: string, params: any): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PATCH',
        `users/${userId}`,
        params
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Reset user password
   * @param projectId
   * @param email
   */
  public async resetPassword(
    projectId: number,
    email: string
  ): Promise<number> {
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
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all the homes belonged to a user
   * @param userId 
   */
  public async getHomes(userId: number): Promise<Home[]> {
    try {
      const response: AxiosResponse<any> = await this.request('GET', `homes`, {
        userId: userId
      });
      return response.data as Home[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get the user's home by a given homeId
   * @param homeId 
   */
  public async getHomeByHomeId(homeId: number) {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}`,
        {}
      );
      return response.data as Home;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get one of the user's homes, create a default home if there isn't one.
   * @param userId 
   */
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

  /**
   * Get device info for the specified deviceId
   * @param deviceId 
   */
  public async getDevice(deviceId: number): Promise<Device> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `devices/${deviceId}`,
        {}
      );
      return response.data as Device;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all the devices info that belonged to the specified homeId
   * @param homeId 
   */
  public async getDevices(homeId: number): Promise<Device[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `devices`,
        { homeId: homeId }
      );
      return response.data as Device[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get the home's time series info for all serties. This will only return the time series'
   * metadata, not the actual time series data.
   * @param homeId
   */
  public async getTSDBInfo(homeId: number): Promise<TimeSeriesInfo[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}/smartModules/tsdb/timeSeries`,
        {}
      );
      return response.data as TimeSeriesInfo[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get time series data for the specified seriesId
   * @param homeId
   * @param seriesId
   * @param startTime
   * @param endTime
   * @param aggregation
   */
  public async getTSDBData(
    homeId: number,
    seriesId: string,
    startTime: string,
    endTime: string,
    aggregation: string = 'avg'
  ): Promise<TimeSeriesData> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}/smartModules/tsdb/timeSeries/${seriesId}` +
          `/data?begin=${startTime}&end=${endTime}&aggregation=${aggregation}`,
        {}
      );

      return response.data as TimeSeriesData;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all key value store for a specific device
   * @param deviceId
   */
  public async getAllDeviceKeyValueStore(
    deviceId: number
  ): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `devices/${deviceId}/kv`,
        {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get the value of a key value store for a given device and key
   * @param deviceId
   * @param key
   */
  public async getDeviceKeyValueStore(
    deviceId: number,
    key: string
  ): Promise<KeyValueStore> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `devices/${deviceId}/kv/${key}`,
        {}
      );
      return response.data as KeyValueStore;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all the key value stores that are started with the specified keyPrefix
   * @param deviceId
   * @param keyPrefix
   */
  public async getAllDeviceKeyValueStoreByPrefix(
    deviceId: number,
    keyPrefix: string
  ): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `devices/${deviceId}/kv?keyPrefix=${keyPrefix}`,
        {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Add/Update a key value store for a device. Only the store's value will be updated.
   * @param deviceId
   * @param key
   * @param store
   */
  public async setDeviceKeyValueStore(
    deviceId: number,
    key: string,
    store: KeyValueStore
  ): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT',
        `devices/${deviceId}/kv/${key}`,
        {
          value: store.value
        }
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Delete a key value store from a device
   * @param deviceId
   * @param key
   * @returns number response status
   */
  public async deleteDeviceKeyValueStore(
    deviceId: number,
    key: string
  ): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'DELETE',
        `devices/${deviceId}/kv/${key}`,
        {}
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all key value store for a specific home
   * @param homeId
   */
  public async getAllHomeKeyValueStore(
    homeId: number
  ): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}/kv`,
        {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get the key value store for a given home and key
   * @param homeId
   * @param key
   */
  public async getHomeKeyValueStore(
    homeId: number,
    key: string
  ): Promise<KeyValueStore> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}/kv/${key}`,
        {}
      );
      return response.data as KeyValueStore;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Get all the key value stores for a specific home that has keys started with the specified keyPrefix
   * @param homeId
   * @param keyPrefix
   */
  public async getAllHomeKeyValueStoreByPrefix(
    homeId: number,
    keyPrefix: string
  ): Promise<KeyValueStore[]> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'GET',
        `homes/${homeId}/kv?keyPrefix=${keyPrefix}`,
        {}
      );
      return response.data as KeyValueStore[];
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Add/Update a key value store for a home
   * @param homeId
   * @param key
   * @param store
   */
  public async setHomeKeyValueStore(
    homeId: number,
    key: string,
    store: KeyValueStore
  ): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT',
        `homes/${homeId}/kv/${key}`,
        {
          value: store.value
        }
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Delete a key value store from a home
   * @param homeId
   * @param key
   * @returns number response status
   */
  public async deleteHomeKeyValueStore(
    homeId: number,
    key: string
  ): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'DELETE',
        `homes/${homeId}/kv/${key}`,
        {}
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Send a command to a device
   * @param deviceId
   * @param params
   */
  public async sendCommand(deviceId: number, params: any): Promise<number> {
    try {
      const response: AxiosResponse<any> = await this.request(
        'PUT',
        `devices/${deviceId}/command`,
        params
      );
      return response.status;
    } catch (error) {
      throw this.getErrorResponse(error);
    }
  }

  /**
   * Create a home with a default name
   */
  private makeHome() {
    if (this.makeHomePromise === null) {
      this.makeHomePromise = this.request('POST', 'homes', {
        name: 'home'
      }).then((response: any) => {
        console.log('POST /homes success');
        this.defaultHome = response.data;
        return response.data;
      });
    }

    return this.makeHomePromise;
  }

  /**
   * Convert any error object to a standard generic ErrorResponse object. This error object is usually an
   * AxiosError but it can be other error types.
   */
  private getErrorResponse(error: any): ErrorResponse {
    let message: string = 'Unknown error';
    let status: number = 400;

    if (error && error.response && error.response.data) {
      if (
        typeof error.response.data === 'object' &&
        error.response.data.reason
      ) {
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
      status: status
    };
  }

  private _initRequest(
    method: Method,
    path: string,
    withCredentials?: boolean
  ): RequestConfig {
    var url: string;
    if (path.indexOf('://') > -1) {
      url = path;
    } else {
      url = this.baseUrl + path;
    }

    const config: RequestConfig = {
      method: method,
      url: url,
      headers: {}
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
  private request<T>(
    method: Method,
    path: string,
    data: string | Object,
    withCredentials?: boolean
  ) {
    const config: any = this._initRequest(
      method,
      `${this.baseUrl}${path}`,
      withCredentials
    );
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
  private postForm<T>(path: string, postData: Object) {
    const config: any = this._initRequest(
      'POST',
      `${this.baseUrl}${path}`,
      false
    );

    config.data = postData;
    config.headers['Content-Type'] =
      'application/x-www-form-urlencoded; charset=UTF-8';

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
   * Constructor will be private so that no one can instantiate an instance of
   * ModeAPI. Use ModeAPI.getInstance() instead.
   */
  private constructor() {
    this.baseUrl = ModeConstants.MODE_API_BASE_URL;
    this.authToken = '';
    this.axios = Axios.create({
      baseURL: this.baseUrl
    });
  }

}

export default ModeAPI.getInstance();
