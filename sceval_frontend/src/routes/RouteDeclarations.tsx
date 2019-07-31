import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { Login, ResetPassword, Register, Hardware, EmailSent } from '../containers/index';
export interface RouteDeclarationsProps {
  isSavedLoginPresent: boolean;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export enum RouteKeys {
  Home,
  Settings,
  EmailLogin,
  EmailResetPassword,
  EmailRegister,
}

export default class RouteDeclarations extends React.Component<RouteDeclarationsProps, any> {
  render() {
    return [
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/"
          component={() => (
            <Redirect to="/login" />
          )}
        />
      ),
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/login"
          component={() => (
            <>
              <Login
                isLoggedIn={this.props.isLoggedIn}
                onLogIn={this.props.onLogin}
              />
            </>
          )}
        />
      ),
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/reset_password"
          component={() => (
            <>
              <ResetPassword />
            </>
          )}
        />
      ),
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/register"
          component={() => (
            <>
              <Register
                isLoggedIn={this.props.isLoggedIn}
                onLogIn={this.props.onLogin}
              />
            </>
          )}
        />
      ),
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/email_sent"
          component={() => (
            <>
              <EmailSent />
            </>
          )}
        />
      ),
      (
        <Route
          key={RouteKeys.Home}
          exact={true}
          path="/hardware"
          component={() => (
            <>
              <Hardware
                isLoggedIn={this.props.isLoggedIn}
                onLogIn={this.props.onLogin}
              />
            </>
          )}
        />
      ),
    ];
  }
}