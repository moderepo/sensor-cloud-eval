import * as React from 'react';

interface ContextProviderStateBase  {

}

interface ContextAction {

}

export interface Context {

}

const context = React.createContext<any>(null);

export class ContextProvider extends React.Component<{}, ContextProviderStateBase> {
  state: ContextProviderStateBase = {

  };

//   componentDidMount() {

//   }

  render() {
    return (
      <context.Provider
        value={{
            state: this.state,
            actions: {
            }
        }}
      > 
      {this.props.children}
      </context.Provider>
    );
  }
}

export const ContextConsumer = context.Consumer;