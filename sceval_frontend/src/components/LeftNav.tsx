import React from 'react';
import { NavLink } from 'react-router-dom';
// import required images
const modeLogo = require('../common_images/mode-logo.svg');
const hardware = require('../common_images/navigation/nav-gateway.svg');
const profile = require('../common_images/navigation/default-avatar.svg');

export const LeftNav: React.FC = () => {
  return (
    <div className="navigation-bar">
      <div className="sidebar-head">
        <img src={modeLogo} className="nav-logo" />
        <hr />
      </div>
      <NavLink className="navigation-item account" to="/my_account">
        <img src={profile} className="icon avatar" />
        <p>
          {JSON.parse(`${localStorage.getItem('user-login')}`).value.user.name}
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
