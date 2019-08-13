import React, { useState, useEffect } from 'react';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';

interface ContextProviderProps extends React.Props<any> {}

interface ContextAction {
    setGateway: (gatewayID: string) => void;
    setWebsocket: (websocket: WebSocket) => void;
}

interface ContextState  {
    selectedGateway: string;
    webSocket: WebSocket;
    devices: Array<any>;
}
export interface Context {
    state: ContextState;
    actions: ContextAction;
}

export const context = React.createContext<any>(null);
export const ContextProvider: React.FC<ContextProviderProps> = (
    props: ContextProviderProps
) => {
    const [selectedGateway, setSelectedGateway] = useState<string>('');
    const [webSocket, setWebSocket] = useState();
    const [devices, setDevices] = useState([]);
    const setGateway = (gatewayID: string) => {
        setSelectedGateway(gatewayID);
    };

    const setWebsocket = (websocket: WebSocket) => {
        setWebSocket(websocket);
    };
    const values: ContextState = {
        selectedGateway: selectedGateway,
        webSocket: webSocket,
        devices: devices
    };

    useEffect(
        () => {
            AppContext.restoreLogin(); // restore user credentials and get home / associated devices
            modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
            .then((response: any) => {
                modeAPI
                .getDevices(response.id)
                .then((deviceResponse: any) => {
                    setDevices(deviceResponse);
            });
        });
    },
        []);

    return (
        <context.Provider
            value={{
                state: values,
                actions: {
                    setGateway: setGateway,
                    setWebsocket: setWebsocket
                }
            }}
        >
            {props.children}
        </context.Provider>
    );
};

export const ContextConsumer = context.Consumer;
