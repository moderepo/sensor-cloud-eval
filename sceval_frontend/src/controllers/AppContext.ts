import ClientStorage from './ClientStorage';
import ModeAPI from './ModeAPI';
import User from './User';
import { ConcreteObservable } from './Observer';
import { AxiosResponse } from 'axios';

const MODE_API_BASE_URL = 'https://api.tinkermode.com';

export interface UserWithPassword extends User {
  password: string;
}

export interface LoginInfo {
  user: UserWithPassword;
  authToken: string;
  projectId: number;
}

export interface ClientAuthInfo {
  token: string;
  userId: number;
}

export class UserNameChangeException {}

export class AppContext {
  private static entryName = 'user-login';
  private static appId: string = 'app';
  private static projectId: number = 0;
  private static appSetting: {[id: string]: any};
  private static loginInfo: LoginInfo | null = null;
  private static userChangeObservable = new ConcreteObservable<User>();

  public static getAppSetting() {
    return AppContext.appSetting;
  }

  public static setAppSetting(setting: {[id: string]: any}) {
    AppContext.appSetting = setting;
  }

  public static getEntryName() {
    return AppContext.entryName;
  }

  public static setEntryName(name: string) {
    AppContext.entryName = name;
  }

  public static setAppId(appId: string) {
    AppContext.appId = appId;
  }

  public static setProjectId(projectId: number) {
    AppContext.projectId = projectId;
  }

  public static getProjectId() {
    return AppContext.projectId;
  }

  public static getLoginInfo() {
    return AppContext.loginInfo;
  }

  public static getUserChangeObservable() {
    return AppContext.userChangeObservable;
  }

  public static postLoginForm(username: string, password: string) {
    return ModeAPI.postForm(
      MODE_API_BASE_URL + '/auth/user',
      {
        projectId: AppContext.projectId,
        appId: AppContext.appId,
        email: username,
        password: password
      }
    )
    .then((resp: any) => {
      return AppContext.setLogin(resp.data);
    });
  }

  public static changeUserName(newUsername: string) {
    if (AppContext.loginInfo !== null) {
      const params = {
        name: newUsername
      };
      const user = AppContext.loginInfo.user;

      return ModeAPI.request<UserWithPassword>(
      'PATCH', 
      MODE_API_BASE_URL + '/users/' + AppContext.loginInfo.user.id, params).then(
        (response: AxiosResponse<UserWithPassword>) => {
          user.name = newUsername;
          AppContext.userChangeObservable.notifyAll(user);
          return response;
        }
      );
    } else {
      throw new UserNameChangeException;
    }
  }

  public static setLogin(auth: ClientAuthInfo) {
    ModeAPI.setAuthToken(auth.token);
    return new Promise<LoginInfo>(function(resolve: (loginInfo: LoginInfo) => void, reject: (reason: any) => void) {
      ModeAPI.request('GET', MODE_API_BASE_URL + '/users/' + auth.userId, {}, false)
      .then(function (resp: any) {
        const loginInfo: LoginInfo = {
          'user': resp.data,
          'authToken': auth.token,
          'projectId': AppContext.projectId
        };

        AppContext.updateLoginInfo(loginInfo);
        resolve(loginInfo);
      })
      .catch(function (resp: any) {
        var err = (resp.data && resp.data.reason) ? resp.data.reason : 'CONNECTION_ERROR';
        console.warn('Failed to fetch user:', err);
        reject(err);
      });
    });
  }

  public static restoreLogin() {
    return new Promise(
      function(resolve: (result: LoginInfo) => void, reject: (reason: any) => void) {
        const loginInfo = ClientStorage.getItem(AppContext.entryName);
        AppContext.loginInfo = loginInfo;

        if (loginInfo && loginInfo.user && loginInfo.authToken) {
          console.log('Validating saved login for', loginInfo.user);
          ModeAPI.setAuthToken(loginInfo.authToken);
          ModeAPI.request('GET', MODE_API_BASE_URL + '/users/' + loginInfo.user.id, {}, false)
          .then(function(res: any) {
            const user = res.data as User;
            // use latest user data because it may be different
            loginInfo.user = user;
            AppContext.updateLoginInfo(loginInfo);
            resolve(loginInfo);
          })
          .catch(function(res: any) {
            if (res.data && res.data.reason) {
              // Remove invalid/obsolete login credentials.
              ClientStorage.deleteItem(AppContext.entryName);
              reject('USER_NOT_FOUND');
            } else {
              reject('CONNECTION_ERROR');
            }
          });

        } else {
          reject('LOGIN_CREDENTIALS_NOT_PRESENT');
        }
      }
    );
  }

  public static clearLogin() {
    ModeAPI.setAuthToken('');
    ClientStorage.deleteItem(AppContext.entryName);
  }

  private static updateLoginInfo(loginInfo: LoginInfo) {
    ClientStorage.setItem(AppContext.entryName, loginInfo, 0);
    AppContext.loginInfo = loginInfo;
  }
}

export default AppContext;
