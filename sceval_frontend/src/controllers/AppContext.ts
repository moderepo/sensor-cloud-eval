import ClientStorage from './ClientStorage';
import modeAPI from './ModeAPI';
import { User, LoginInfo, ClientAuthInfo } from '../components/entities/User';
import { ConcreteObservable } from './Observer';
import * as Constants from '../utils/Constants';
import { ErrorResponse } from '../components/entities/API';

export class UserNameChangeException {}

export class AppContext {
  private static entryName = 'user-login';
  private static appId: string = 'app';
  private static projectId: number = 0;
  private static appSetting: { [id: string]: any };
  private static loginInfo: LoginInfo | null = null;
  private static userChangeObservable = new ConcreteObservable<User>();
  private static sessionDuration = Constants.DAY_IN_SECS * 90; // 90 days

  // public method for retreiving AppContext.appSetting
  public static getAppSetting() {
    return AppContext.appSetting;
  }
  // public method for setting AppContext.appSetting
  public static setAppSetting(setting: { [id: string]: any }) {
    AppContext.appSetting = setting;
  }
  // public method for retreiving AppContext.entryName
  public static getEntryName() {
    return AppContext.entryName;
  }
  // public method for setting AppContext.entryName
  public static setEntryName(name: string) {
    AppContext.entryName = name;
  }
  // public method for setting AppContext.appId
  public static setAppId(appId: string) {
    AppContext.appId = appId;
  }
  // public method for setting AppContext.projectId
  public static setProjectId(projectId: number) {
    AppContext.projectId = projectId;
  }
  // public method for retreiving AppContext.projectId
  public static getProjectId() {
    return AppContext.projectId;
  }
  // public method for retreiving AppContext.loginInfo
  public static getLoginInfo() {
    return AppContext.loginInfo;
  }
  // public method for retreiving AppContext.userChangeObservable
  public static getUserChangeObservable() {
    return AppContext.userChangeObservable;
  }
  // public method for posting user login information
  public static async postLoginForm(
    username: string,
    password: string
  ): Promise<LoginInfo> {
    const userInfo: any = await modeAPI.login(
      AppContext.projectId,
      AppContext.appId,
      username,
      password
    );
    return AppContext.setLogin(userInfo);
  }
  // public method for updating the user's username
  public static async changeUserName(newUsername: string): Promise<number> {
    if (AppContext.loginInfo !== null) {
      const user = AppContext.loginInfo.user;
      const status: number = await modeAPI.updateUserInfo(
        AppContext.loginInfo.user.id.toString(),
        {
          name: newUsername
        }
      );
      user.name = newUsername;
      AppContext.userChangeObservable.notifyAll(user);
      return status;
    } else {
      throw new UserNameChangeException();
    }
  }
  // public method for updating both the user's username and password
  public static async UpdateUserInfo(
    newUsername: string,
    newPassword: string
  ): Promise<number> {
    if (AppContext.loginInfo !== null) {
      const user = AppContext.loginInfo.user;
      const status: number = await modeAPI.updateUserInfo(
        AppContext.loginInfo.user.id.toString(),
        { name: newUsername, password: newPassword }
      );
      user.name = newUsername;
      AppContext.userChangeObservable.notifyAll(user);
      return status;
    } else {
      throw new UserNameChangeException();
    }
  }
  // public method for setting the user's login information
  public static setLogin(auth: ClientAuthInfo) {
    // set the auth token
    modeAPI.setAuthToken(auth.token);
    return new Promise<LoginInfo>(function(
      resolve: (loginInfo: LoginInfo) => void,
      reject: (reason: any) => void
    ) {
      // retreive the user's information
      modeAPI
        .getUserInfo(auth.userId)
        .then(function(userInfo: User) {
          const loginInfo: LoginInfo = {
            user: userInfo,
            authToken: auth.token,
            projectId: AppContext.projectId
          };
          // update the login information
          AppContext.updateLoginInfo(loginInfo);
          resolve(loginInfo);
        })
        .catch(function(resp: any) {
          var err =
            resp.data && resp.data.reason
              ? resp.data.reason
              : Constants.ERROR_CONNECTION_ERROR;
          console.warn('Failed to fetch user:', err);
          reject(err);
        });
    });
  }
  // public method for restoring the user's login from client storage
  public static restoreLogin() {
    return new Promise(function(
      resolve: (result: LoginInfo) => void,
      reject: (error: ErrorResponse) => void
    ) {
      const loginInfo = ClientStorage.getItem(AppContext.entryName);
      AppContext.loginInfo = loginInfo;

      if (loginInfo && loginInfo.user && loginInfo.authToken) {
        console.log('Validating saved login for', loginInfo.user);
        modeAPI.setAuthToken(loginInfo.authToken);
        modeAPI
          .getUserInfo(loginInfo.user.id)
          .then(function(user: User) {
            // use latest user data because it may be different
            loginInfo.user = user;
            AppContext.updateLoginInfo(loginInfo);
            resolve(loginInfo);
          })
          .catch(function(error: ErrorResponse) {
            ClientStorage.deleteItem(AppContext.entryName);
            reject(error);
          });
      } else {
        reject({
          status: 400,
          message: Constants.ERROR_LOGIN_CREDENTIALS_NOT_PRESENT
        });
      }
    });
  }

  /**
   * Log the user out. By default, this will log the user out from the backend as well by clearning the session.
   * If we only need to log the user out from the front end, pass 'false' for clearSession.
   * @param clearSession
   */
  public static async logout(clearSession: boolean = true) {
    if (clearSession) {
      // log the user out from the backend
      try {
        await modeAPI.logout();
      } catch (error) {
        console.log(error);
      }
    }

    // log the user out from the frontend
    modeAPI.setAuthToken('');
    ClientStorage.deleteItem(AppContext.entryName);
  }
  // provide method for updating login information
  private static updateLoginInfo(loginInfo: LoginInfo) {
    ClientStorage.setItem(AppContext.entryName, loginInfo, AppContext.sessionDuration);
    AppContext.loginInfo = loginInfo;
  }
}

export default AppContext;