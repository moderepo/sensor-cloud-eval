import React, { useState, useEffect } from 'react';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';

interface ContextProviderProps extends React.Props<any> {}
// declare a ContextAction interface for updating context state
interface ContextAction {
  setGateway: (gatewayID: number) => void;
  setRTValues: (vals: any) => void;
  setUsername: (username: any) => void;
}
// declare a ContextState interface for defining state types
interface ContextState {
  selectedGateway: number;
  rtValues: Array<any>;
  devices: Array<any>;
  userData: any;
}
// export the Context interface for global access
export interface Context {
  state: ContextState;
  actions: ContextAction;
}
// create a React context instance
export const context = React.createContext<any>(null);
// define a functional provider component
export const ContextProvider: React.FC<ContextProviderProps> = (
  props: ContextProviderProps
) => {
  // gateway currently being selected by user
  const [selectedGateway, setSelectedGateway] = useState<number>(0);
  // real time values from websocket events
  const [rtVals, setRTVals] = useState([]);
  // user login information
  const [userData, setUserData] = useState();
  // a list of devices associated to the user's home.
  const [devices, setDevices] = useState([]);
  // method for setting the selected gateway
  const setGateway = (gatewayID: number) => {
    setSelectedGateway(gatewayID);
  };
  /**
   * method for setting real-time values
   * @param vals
   */
  const setRealTimeValues = (vals: any) => {
    setRTVals(vals);
  };
  /**
   * method for updating user info
   * @param username
   */
  const setUsername = (username: string) => {
    let userInfo = userData;
    if (userInfo) {
      userInfo.user.name = username;
      setUserData(userInfo);
    }
  };
  // define values object for passing to children via provider
  const values: ContextState = {
    selectedGateway: selectedGateway,
    rtValues: rtVals,
    devices: devices,
    userData: userData
  };

  useEffect(() => {
    // restore user credentials and get home / associated devices
    AppContext.restoreLogin();
    const userInfo = ClientStorage.getItem('user-login');
    if (userInfo) {
      setUserData(userInfo);
      modeAPI
        .getHome(userInfo.user.id)
        .then((response: any) => {
          // get devices associated with the home
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
