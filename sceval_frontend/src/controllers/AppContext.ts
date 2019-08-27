import ClientStorage from './ClientStorage';
import modeAPI from './ModeAPI';
import { User, LoginInfo, ClientAuthInfo } from '../components/entities/User';
import { ConcreteObservable } from './Observer';
import { Constants } from '../utils/Constants';

export class UserNameChangeException {}

export class AppContext {
  private static entryName = 'user-login';
  private static appId: string = 'app';
  private static projectId: number = 0;
  private static appSetting: { [id: string]: any };
  private static loginInfo: LoginInfo | null = null;
  private static userChangeObservable = new ConcreteObservable<User>();

  public static getAppSetting() {
    return AppContext.appSetting;
  }

  public static setAppSetting(setting: { [id: string]: any }) {
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

  public static changeUserName(newUsername: string) {
    if (AppContext.loginInfo !== null) {
      const user = AppContext.loginInfo.user;
      modeAPI
        .updateUserInfo(AppContext.loginInfo.user.id.toString(), {
          name: newUsername
        })
        .then((status: number) => {
          user.name = newUsername;
          AppContext.userChangeObservable.notifyAll(user);
          return status;
        });
    } else {
      throw new UserNameChangeException();
    }
  }

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

  public static setLogin(auth: ClientAuthInfo) {
    modeAPI.setAuthToken(auth.token);
    return new Promise<LoginInfo>(function(
      resolve: (loginInfo: LoginInfo) => void,
      reject: (reason: any) => void
    ) {
      modeAPI
        .getUserInfo(auth.userId)
        .then(function(userInfo: User) {
          const loginInfo: LoginInfo = {
            user: userInfo,
            authToken: auth.token,
            projectId: AppContext.projectId
          };

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

  public static restoreLogin() {
    return new Promise(function(
      resolve: (result: LoginInfo) => void,
      reject: (reason: any) => void
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
          .catch(function(res: any) {
            if (res.data && res.data.reason) {
              // Remove invalid/obsolete login credentials.
              ClientStorage.deleteItem(AppContext.entryName);
              reject(Constants.ERROR_USER_NOT_FOUND);
            } else {
              reject(Constants.ERROR_CONNECTION_ERROR);
            }
          });
      } else {
        reject(Constants.ERROR_LOGIN_CREDENTIALS_NOT_PRESENT);
      }
    });
  }

  public static clearLogin() {
    modeAPI.setAuthToken('');
    ClientStorage.deleteItem(AppContext.entryName);
  }

  private static updateLoginInfo(loginInfo: LoginInfo) {
    ClientStorage.setItem(AppContext.entryName, loginInfo, 0);
    AppContext.loginInfo = loginInfo;
  }
}

export default AppContext;
