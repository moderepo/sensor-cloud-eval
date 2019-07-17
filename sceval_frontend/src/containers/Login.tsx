import React, { Component, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
const modeLogo = require('../common_images/mode-logo-dark.svg');

interface LoginState {
    emailValid: boolean;
    submitted: boolean;
}

interface LoginProps {}
export class Login extends Component<LoginProps, LoginState> {
    constructor(props: any) {
        super(props);
        this.state = {
            emailValid: false,
            submitted: false
        };
    }
    render() {
        return (
            <Fragment>
                <div className="login-header">
                    <img src={modeLogo} className="login-mode-logo" />
                    <h1 className="title">MODE SENSOR CLOUD</h1>
                    <hr />
                </div>
                <div className="login-section">
                    <h1 className="title">Welcome Back!</h1>
                    <p id="login-text">Your sensor data is just one log-in away</p>
                    <form className="form-group">
                        <input 
                            type="email" 
                            className="form-control"
                        />
                        <input type="password" className="form-control" />
                        <button 
                            type="submit" 
                            className={this.state.emailValid ?
                                'btn btn-primary btn-large' : 'btn btn-primary btn-large disabled'}
                            disabled={this.state.emailValid ? false : true}
                        >Log In
                        </button>
                    </form>
                    <div className="dont-have-account">
                        <p>{`Don't have an acount yet? `}  
                            <NavLink 
                                to="/register"
                                className="navlinks"
                            >
                            Sign Up!
                            </NavLink>
                        </p>
                        <p>or</p>
                        <NavLink 
                            to="/email_reset_password" 
                            className="navlinks"
                        >Forgot Password?
                        </NavLink>
                    </div>
                </div>
                
            </Fragment>
        );
    }
}

export default Login;
