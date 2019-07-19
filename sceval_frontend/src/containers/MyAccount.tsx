import React, { Component } from 'react';
import LeftNav from '../components/LeftNav';
import AppContext from '../controllers/AppContext';
import { Redirect } from 'react-router';

const email = require('../common_images/acct_email.svg');
const name = require('../common_images/acct_name.svg');
const password = require('../common_images/acct_password.svg');

interface HardwareProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

interface HardwareState {

}
export class MyAccount extends Component<HardwareProps, HardwareState> {

    logout() {
        AppContext.clearLogin();  
        setTimeout(
            () => {
                location.pathname = '/login';
            },
            1000
        );
    }
    render() {
        if (!this.props.isLoggedIn) {
            return <Redirect to="/login" />;
        }
        const userInfo = JSON.parse(`${localStorage.getItem('user-login')}`);
        return (
            <div>
                <LeftNav />
                <div className="account-section">
                    <div className="page-header">
                        <h1>My Account</h1>
                    </div>
                    <div className="info-container">
                        <div className="user-info-section">
                            <h3>User Info 
                                {/* <button className="edit-button">Edit</button> */}
                            </h3>
                            
                            <h4><img src={name} /> Name:</h4>
                            <div className="user-data">{userInfo.value.user.name}</div>
                            <h4><img src={email} /> Email:</h4>
                            <div className="user-data">{userInfo.value.user.email}</div>
                            <h4>
                                <img src={password} /> 
                                Password:
                            </h4>
                            <div className="user-data">
                                {/* {userInfo.value.user.password} */}
                                ••••••••••
                            </div>
                        </div>                    
                        <div className="sign-out-section">
                            <h3>Sign Out</h3>
                            <button 
                                className="sign-out-button"
                                onClick={this.logout}
                            >Sign Out
                            </button>
                        </div>
                    </div>
                    <div className="footer">
                        <a 
                            href="https://www.tinkermode.com/legal/tos.html"
                            target="_blank"
                        >Terms of Service
                        </a>
                        <div>•</div>
                        <a 
                            href="https://www.tinkermode.com/legal/privacy.html"
                            target="_blank"
                        >Privacy Policy
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}

export default MyAccount;
