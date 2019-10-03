import { useState, useEffect } from 'react';
import { LoginInfo } from '../components/entities/User';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import { Home, ErrorResponse } from '../components/entities/API';

/**
 * Custom Hook for checking user's login status.
 */
export interface LoginInfoState {
  loginInfo: LoginInfo | undefined;
  error: ErrorResponse | undefined;
  isLoading: boolean;
}
export const useCheckUserLogin = (): LoginInfoState => {
  // We combine loginInfo and isLoading in the same object for optimization. These 2 usually change at the same time
  // so we only need to call setState 1 time. If they were separated, we have to call setLoginInfo and setIsLoading
  // which will cause the user of this hook to rerender twice.
  const [state, setState] = useState<LoginInfoState>({
    loginInfo: undefined,
    isLoading: true,
    error: undefined
  });

  useEffect(() => {
    setState(
      (currentState: LoginInfoState): LoginInfoState => {
        return { ...currentState, isLoading: true };
      }
    );
    AppContext.restoreLogin()
      .then((loginInfo: LoginInfo): void => {
        setState(
          (currentState: LoginInfoState): LoginInfoState => {
            return { ...currentState, loginInfo: loginInfo, isLoading: false };
          }
        );
      })
      .catch((error): void => {
        // Put the error in the state and let the suer handle the error
        setState(
          (currentState: LoginInfoState): LoginInfoState => {
            return { ...currentState, isLoading: false, error: error };
          }
        );
      });
  }, []);

  // Return the loginInfo and also the isLoading state so the user of this hook can do something when loading
  return state;
};

/**
 * Custom hook for loading user's home
 */
export interface LoadHomeState {
  home: Home | undefined;
  isLoading: boolean;
}
export const useLoadUserHome = (loginInfo: LoginInfo | undefined): LoadHomeState => {
  const [state, setState] = useState<LoadHomeState>({
    home: undefined,
    isLoading: true
  });

  useEffect(() => {
    if (loginInfo) {
      setState(
        (currentState: LoadHomeState): LoadHomeState => {
          return { ...currentState, isLoading: true };
        }
      );
      modeAPI
        .getHome(loginInfo.user.id)
        .then((home: Home): void => {
          setState(
            (currentState: LoadHomeState): LoadHomeState => {
              return { ...currentState, home: home, isLoading: false };
            }
          );
        })
        .catch((error: any): void => {
          // Something is wrong, user is homeless.
          setState(
            (currentState: LoadHomeState): LoadHomeState => {
              return { ...currentState, isLoading: false };
            }
          );
        });
    }
  }, [loginInfo]);

  // Return the home and also the isLoading state so the user of this hook can do something when loading
  return state;
};

/**
 * Custom hook for checking if if something is loading. Use this hook when you many things that are loading
 * and you need to wait until all of them are done.
 * @param args
 */
export const useIsLoading = (...args: boolean[]): boolean => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (args) {
      // go through each item in the list of arguments to check each state. If one of the item is true,
      // this will return true.
      setIsLoading(
        args.find((state: boolean): boolean => {
          return state;
        }) === true
      );
    }
  }, args);

  return isLoading;
};
