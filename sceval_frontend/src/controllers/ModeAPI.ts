import Axios, { Method } from 'axios';
import { AxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import Home from './Home';
import moment from 'moment';

const MODE_API_BASE_URL = 'https://api.tinkermode.com/';

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
  modificationTime: string;
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
   * AxiosError but it cab be other error types.
   */
  public static getErrorResponse (error: any): ErrorResponse {
    let message: string = 'Unknown error';
    let status: number = 400;

    if (error && error.response && error.response.data) {
      message = error.response.data;
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
    var config = this._initRequest(method, path, withCredentials);
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
    var config = this._initRequest('POST', path, false);

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

  public async getHomes(userId: number): Promise<Home[]> {
    try {
      let response: AxiosResponse<any> = await this.request('GET', `${MODE_API_BASE_URL}homes`, {userId: userId});
      return response.data as Home[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getHomeByHomeId(homeId: number) {
    try {
      let response: AxiosResponse<any> = await this.request('GET', `${MODE_API_BASE_URL}homes/${homeId}`, {});
      return response.data as Home;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public getHome(userId: number) {
    if (this.defaultHome === null) {
      return this.getHomes(userId).then((homes: Home[]) => {
        console.log('GET /homes - success');
        if (homes.length > 0) {
          // pick the first home
          this.defaultHome = homes[0];
          return Promise.resolve(homes[0]);
        } else {
          // If no home, create "home" once.
          return this.makeHome();
        }
      });
    } else {
      return Promise.resolve(this.defaultHome);
    }
  }

  public async getDevice(deviceId: number): Promise<Device> {
    try {
      let response: AxiosResponse<any> = await this.request('GET', `${MODE_API_BASE_URL}${deviceId}`, {});
      return response.data as Device;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  public async getDevices(homeId: number): Promise<Device[]> {
    try {
      let response: AxiosResponse<any> = await this.request('GET', `${MODE_API_BASE_URL}devices`, {homeId: homeId});
      return response.data as Device[];
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  /**
   * Get the home's time series info for all serties. This will only return the time series'
   * metadata data, not the actuel time series data.
   * @param homeID
   * @param seriesID 
   * @param startTime 
   * @param endTime 
   * @param aggregation 
   */
  public async getTSDBInfo (homeID: string): Promise<TimeSeriesInfo[]> {
    try {
      let response: AxiosResponse<any> = await this.request(
        'GET', `${MODE_API_BASE_URL}homes/${homeID}/smartModules/tsdb/timeSeries`, {});
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
      let response: AxiosResponse<any> = await this.request(
        'GET',
        `${MODE_API_BASE_URL}homes/${homeID}/smartModules/tsdb/timeSeries/${seriesID}` +
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
      let response: AxiosResponse<any> = await this.request('GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv`, {});
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
      let response: AxiosResponse<any> = await this.request(
        'GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv/${key}`, {}
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
      let response: AxiosResponse<any> = await this.request(
        'GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv?keyPrefix=${keyPrefix}`, {}
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
      let response: AxiosResponse<any> = await this.request(
        'PUT', `${MODE_API_BASE_URL}devices/${deviceID}/kv/${key}`, {
          value: store.value
        }
      );
      return response.status;
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
      let response: AxiosResponse<any> = await this.request(
        'PUT', `${MODE_API_BASE_URL}homes/${homeID}/kv/${key}`, {
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
      let response: AxiosResponse<any> = await this.request(
        'DELETE', `${MODE_API_BASE_URL}devices/${deviceID}/kv/${key}`, {}
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
      let response: AxiosResponse<any> = await this.request(
        'DELETE', `${MODE_API_BASE_URL}homes/${homeID}/kv/${key}`, {}
      );
      return response.status;
    } catch (error) {
      throw ModeAPI.getErrorResponse(error);
    }
  }

  private makeHome() {
    if (this.makeHomePromise === null) {
      this.makeHomePromise = this.request('POST', '/homes', {name: 'home'})
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