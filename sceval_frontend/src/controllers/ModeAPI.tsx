import Axios from 'axios';
import { AxiosRequestConfig, AxiosInstance, AxiosResponse } from 'axios';

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

export class ModeAPI {
  private baseUrl: string;
  private authToken: string;
  private axios: AxiosInstance;

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

  public _initRequest(method: string, path: string, withCredentials?: boolean): RequestConfig {
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
  public request<T>(method: string, path: string, data: string | Object, withCredentials?: boolean) {
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
}

export default (new ModeAPI);