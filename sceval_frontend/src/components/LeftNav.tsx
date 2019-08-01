import React from 'react';
import { NavLink } from 'react-router-dom';

const modeLogo = require('../common_images/mode-logo.svg');
const hardware = require('../common_images/navigation/nav-icon-hardware.svg');
const profile = require('../common_images/navigation/default-avatar.svg');

export const LeftNav: React.FC = () => {
  return (
    <div className="navigation-bar">
      <div className="sidebar-head">
        <img src={modeLogo} className="nav-logo" />
        <hr />
      </div>
      <div className="avatar-container">
        <NavLink to="/my_account">
          <img src={profile} className="avatar" />
          <p>
            {
              JSON.parse(`${localStorage.getItem('user-login')}`).value.user
                .name}
          </p>
        </NavLink>
      </div>
      <div className="hardware-container">
        <NavLink to="/devices">
          <img src={hardware} className="hardware-logo" />
          <p>Hardware</p>
        </NavLink>
      </div>
    </div>
  );
};

export default LeftNav;
