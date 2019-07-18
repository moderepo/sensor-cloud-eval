import React, { Component } from 'react';
import RouteDeclarations from './routes/RouteDeclarations';
import { Route } from 'react-router-dom';
import { ContextProvider } from './context/Context';
import { AppContext, LoginInfo } from './controllers/AppContext';
import './css/App.css';

export interface AppState {
  isAuthenticated: boolean;
  isLoggedIn: boolean;
}

export interface AppProps {

}
export class App extends Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props);
    this.state = {
      isLoggedIn: false,
      isAuthenticated: false,
    };
    this.onLogin = this.onLogin.bind(this);
  }

  async onLogin() {
    this.setState(() => {
      return {
        isLoggedIn: true,
        isAuthenticated: true,
      };
    });
  }
  render () {
    
    return (
      <ContextProvider>
        <div className="App">
          <Route>
            <RouteDeclarations
              onLogin={this.onLogin}
              isLoggedIn={this.state.isLoggedIn}
              isAuthenticated={this.state.isAuthenticated}
              isSavedLoginPresent={true}
            />
          </Route>
        </div>
      </ContextProvider>
    );
  }
}

export default App;
