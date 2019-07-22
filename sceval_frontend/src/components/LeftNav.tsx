import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';

const modeLogo = require('../common_images/mode-logo.svg');
const hardware = require('../common_images/navigation/nav-icon-hardware.svg');
const profile = require('../common_images/navigation/default-avatar.svg');

export class LeftNav extends Component {
    render() {
        return (
            <div className="navigation-bar">
                <div className="sidebar-head">
                    <img src={modeLogo} className="nav-logo" />
                    <hr />
                </div>
                <div className="avatar-container">
                    <NavLink to="/my_account">
                        <img src={profile} className="avatar"/>
                        <p>{JSON.parse(`${localStorage.getItem('user-login')}`).value.user.name}</p>
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
    }
}

export default LeftNav;
