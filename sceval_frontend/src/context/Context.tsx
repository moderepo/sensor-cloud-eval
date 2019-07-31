import React from 'react';

interface ContextProviderProps extends React.Props<any> {}

interface ContextAction {}

export interface Context {}

const context = React.createContext<any>(null);
export const ContextProvider: React.FC<ContextProviderProps> = (
    props: ContextProviderProps
) => {
    return (
        <context.Provider
            value={{
                state: {},
                actions: {}
            }}
        >
            {props.children}
        </context.Provider>
    );
};

export const ContextConsumer = context.Consumer;
