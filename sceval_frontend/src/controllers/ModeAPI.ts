import Axios, { Method } from 'axios';
import { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';
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

  public getHomes(userId: number) {
    return new Promise(
      (resolve: (homes: Home[]) => void, reject: (reason?: any) => void) => {
        return this.request<Home[]>('GET', MODE_API_BASE_URL + 'homes', {userId: userId})
        .then((response: AxiosResponse<any>) => {
          resolve(response.data);
        });
      }
    );
  }

  public async getHomeByHomeId(homeId: number) {
    const response = await this.request<Home>('GET', MODE_API_BASE_URL + 'homes/' + homeId, {});
    return response.data as Home;
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

  public getDevice(deviceId: number) {
    return new Promise<Device>(
      (resolve: (value?: Device) => void, reject: (reason?: any) => void) => {
        return this.request('GET', MODE_API_BASE_URL + deviceId, {}).then(
          (response: AxiosResponse<any>) => {
            resolve(response.data as Device);
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  public getDevices(homeId: number) {
    return new Promise<Device[]>(
      (resolve: (value?: Device[]) => void, reject: (reason?: any) => void) => {
        return this.request('GET', MODE_API_BASE_URL + 'devices', { homeId: homeId }).then(
          (response: AxiosResponse<any>) => {
            resolve(response.data as Device[]);
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  public getTSDBData(homeID: string, seriesID: string, start: string, end: string) {
    const fetchURL = MODE_API_BASE_URL + 'homes/' + homeID + '/smartModules/tsdb/timeSeries/' + seriesID
    + '/data?begin=' + start + '&end=' + end + '&aggregation=avg';
    this.request('GET', fetchURL, {})
    .then((response: any) => {
      return response;
    });
  }

  /**
   * 
   * @param deviceID Get every key value store for a specific device
   */
  public getAllDeviceKeyValueStore (deviceID: string): Promise<KeyValueStore[]> {
    return new Promise<KeyValueStore[]>(
      (resolve: (value?: KeyValueStore[]) => void, reject: (reason?: any) => void) => {
        return this.request('GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv`, {}).then(
          (response: AxiosResponse<any>) => {
            resolve(response.data as KeyValueStore[]);
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  /**
   * 
   * @param deviceID Get the value of a key value store for a given key
   * @param key 
   */
  public getDeviceKeyValueStore (deviceID: string, key: string): Promise<KeyValueStore> {
    return new Promise<KeyValueStore>(
      (resolve: (value?: KeyValueStore) => void, reject: (reason?: any) => void) => {
        return this.request('GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv/${key}`, {}).then(
          (response: AxiosResponse<any>) => {
            resolve(response.data as KeyValueStore);
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  /**
   * Get all the key value stores for a specific device that has keys started with the specified keyPrefix
   * @param deviceID
   * @param keyPrefix 
   */
  public getAllDeviceKeyValueStoreByPrefix (deviceID: string, keyPrefix: string): Promise<KeyValueStore[]> {
    return new Promise<KeyValueStore[]>(
      (resolve: (value?: KeyValueStore[]) => void, reject: (reason?: any) => void) => {
        return this.request('GET', `${MODE_API_BASE_URL}devices/${deviceID}/kv?keyPrefix=${keyPrefix}`, {}).then(
          (response: AxiosResponse<any>) => {
            resolve(response.data as KeyValueStore[]);
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  /**
   * Add/Update a key value store for a device
   * @param deviceID 
   * @param key
   * @param store 
   */
  public setDeviceKeyValueStore (deviceID: string, key: string, store: KeyValueStore): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (reason?: any) => void) => {
        return this.request('PUT', `${MODE_API_BASE_URL}devices/${deviceID}/kv/${key}`, {
          value: store.value
        }).then(
          (response: any) => {
            resolve();
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
  }

  /**
   * Add/Update a key value store for a home
   * @param homeID 
   * @param key
   * @param store 
   */
  public setHomeKeyValueStore (homeID: string, key: string, store: KeyValueStore): Promise<void> {
    return new Promise<void>(
      (resolve: () => void, reject: (reason?: any) => void) => {
        return this.request('PUT', `${MODE_API_BASE_URL}homes/${homeID}/kv/${key}`, {
          value: store.value
        }).then(
          (response: any) => {
            resolve();
          }
        ).catch((reason: any) => {
          reject(reason);
        });
      }
    );
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