import React, { useContext, useEffect, useState } from 'react';
import { NavLink, Redirect } from 'react-router-dom';
import { Context, context } from '../context/Context';
import ClientStorage from '../controllers/ClientStorage';
// import required images
const modeLogo = require('../common_images/logos/mode-logo.svg');
const hardware = require('../common_images/navigation/nav-gateway.svg');
const profile = require('../common_images/navigation/default-avatar.svg');

const userInfo = ClientStorage.getItem('user-info');
interface LeftNavProps {
  isLoggedIn: boolean;
}

export const LeftNav: React.FC<LeftNavProps & React.Props<any>> = (props: LeftNavProps & React.Props<any>) => {
  const appContext: Context = useContext(context);
  const [username, setUsername] = useState();

  const isLoggedIn: boolean = localStorage.getItem('user-login') !== null;

  useEffect(
    () => {
      if (appContext.state.userData) {
        if (appContext.state.userData.user.name !== username) {
          setUsername(appContext.state.userData.user.name);
        }
      }
    },
    [appContext, userInfo]
  );

  if (!isLoggedIn) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="navigation-bar">
      <div className="sidebar-head">
        <img src={modeLogo} className="nav-logo" />
        <hr />
      </div>
      <NavLink className="navigation-item account" to="/my_account">
        <img src={profile} className="icon avatar" />
        <p>
          {userInfo ? userInfo.user.name : username}
        </p>
      </NavLink>
      <NavLink className="navigation-item hardware" to="/devices">
        <img src={hardware} className="icon hardware-logo" />
        <p>Hardware</p>
      </NavLink>
    </div>
  );
};

export default LeftNav;
