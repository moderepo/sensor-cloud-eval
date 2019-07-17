import * as React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { Login } from '../containers/index';
export interface RouteDeclarationsProps {
  isLoggedIn: boolean;
  isSavedLoginPresent: boolean;
  isAdmin: boolean;
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
              <Login />
            </>
          )}
        />
      ),
    ];
  }
}