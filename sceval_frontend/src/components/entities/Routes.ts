export interface RouteDeclarationsProps {
  isSavedLoginPresent: boolean;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  onLogin: () => void;
}

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
  deviceId?: string;
  sensorModuleId?: string;
}
