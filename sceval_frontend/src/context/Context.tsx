import React, { useState } from 'react';

interface ContextProviderProps extends React.Props<any> {}

interface ContextAction {
    setGateway: (gatewayID: string) => void;
    setWebsocket: (websocket: WebSocket) => void;
    setRTValues: (vals: any) => void;
}

interface ContextState  {
    selectedGateway: string;
    webSocket: WebSocket;
    rtValues: Array<any>;
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
    const [rtVals, setRTVals] = useState([]);

    const setGateway = (gatewayID: string) => {
        setSelectedGateway(gatewayID);
    };

    const setWebsocket = (websocket: WebSocket) => {
        setWebSocket(websocket);
    };

    const setRealTimeValues = (vals: any) => {
        setRTVals(vals);
    };

    const values: ContextState = {
        selectedGateway: selectedGateway,
        webSocket: webSocket,
        rtValues: rtVals
    };
    return (
        <context.Provider
            value={{
                state: values,
                actions: {
                    setGateway: setGateway,
                    setWebsocket: setWebsocket,
                    setRTValues: setRealTimeValues
                }
            }}
        >
            {props.children}
        </context.Provider>
    );
};

export const ContextConsumer = context.Consumer;
