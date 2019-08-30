export interface RouteDeclarationsProps {
  // saved login status
  isSavedLoginPresent: boolean;
  // user logged in status
  isLoggedIn: boolean;
  // user authenticated status
  isAuthenticated: boolean;
  // onLogin method
  onLogin: () => void;
}
// declare unique route keys enumeration
export enum RouteKeys {
  Home,
  Login,
  Register,
  ResetPassword,
  Settings,
  EmailSent,
  EmailLogin,
  EmailResetPassword,
  EmailRegister,
  MyAccount,
  Devices,
  SensorModules,
  AddSensorModule,
}

export interface RouteParams {
  // device id param
  deviceId?: string;
  // sensor module id param
  sensorModuleId?: string;
}
