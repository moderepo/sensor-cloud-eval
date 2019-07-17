import React, { Component, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import LoginHeader from '../components/LoginHeader';
interface LoginState {
    inputState: string;
    emailValid: boolean;
}

interface LoginProps {}
export class Login extends Component<LoginProps, LoginState> {
    constructor(props: any) {
        super(props);
        this.state = {
            inputState: '',
            emailValid: false,
        };
    }

    validateEmail (event: React.ChangeEvent<HTMLInputElement>): void {
        const input = event.target.value;
        const re = /\S+@\S+\.\S+/;
        this.setState(() =>  {
            return {
                inputState: input,
                emailValid: re.test(input)
            };
        });
    }
    render() {
        return (
            <Fragment>
                <LoginHeader />
                <div className="login-section">
                    <h1 className="title">Welcome Back!</h1>
                    <p id="login-text">Your sensor data is just one log-in away</p>
                    <form className="form-group">
                        <input 
                            onChange={event => this.validateEmail(event)}
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
                            to="/reset_password" 
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
