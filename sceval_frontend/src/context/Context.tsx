import React, { useState, useEffect } from 'react';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';

interface ContextProviderProps extends React.Props<any> {}

interface ContextAction {
  setGateway: (gatewayID: number) => void;
  setRTValues: (vals: any) => void;
  setUsername: (username: any) => void;
}

interface ContextState {
  selectedGateway: number;
  rtValues: Array<any>;
  devices: Array<any>;
  userData: any;
}
export interface Context {
  state: ContextState;
  actions: ContextAction;
}

export const context = React.createContext<any>(null);
export const ContextProvider: React.FC<ContextProviderProps> = (
  props: ContextProviderProps
) => {
  const [selectedGateway, setSelectedGateway] = useState<number>(0);
  const [rtVals, setRTVals] = useState([]);
  const [userData, setUserData] = useState();
  const [devices, setDevices] = useState([]);
  const setGateway = (gatewayID: number) => {
    setSelectedGateway(gatewayID);
  };

  const setRealTimeValues = (vals: any) => {
    setRTVals(vals);
  };

  const setUsername = (username: string) => {
    let userInfo = userData;
    if (userInfo) {
      userInfo.user.name = username;
      setUserData(userInfo);
    }
  };

  const values: ContextState = {
    selectedGateway: selectedGateway,
    rtValues: rtVals,
    devices: devices,
    userData: userData
  };

  useEffect(() => {
    AppContext.restoreLogin(); // restore user credentials and get home / associated devices
    const userInfo = ClientStorage.getItem('user-login');
    if (userInfo) {
      setUserData(userInfo);
      modeAPI
        .getHome(userInfo.user.id)
        .then((response: any) => {
          modeAPI.getDevices(response.id).then((deviceResponse: any) => {
            setDevices(deviceResponse);
          });
        });
    }
  },        []);

  return (
    <context.Provider
      value={{
        state: values,
        actions: {
          setGateway: setGateway,
          setRTValues: setRealTimeValues,
          setUsername: setUsername
        }
      }}
    >
      {props.children}
    </context.Provider>
  );
};

export const ContextConsumer = context.Consumer;
