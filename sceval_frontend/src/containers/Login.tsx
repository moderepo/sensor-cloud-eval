import React, { Component, Fragment } from 'react';
import { NavLink, Redirect } from 'react-router-dom';
import LoginHeader from '../components/LoginHeader';
import { AppContext, LoginInfo } from '../controllers/AppContext';
import handleErrors from '../utils/ErrorMessages';
interface LoginState {
    emailState: string;
    passwordState: string;
    emailValid: boolean;
    error: string;
}

interface LoginProps extends React.Props<any> {
    onLogIn: () => void;
    isLoggedIn: boolean;
}
export class Login extends Component<LoginProps, LoginState> {
    constructor(props: any) {
        super(props);
        this.state = {
            emailState: '',
            passwordState: '',
            emailValid: false,
            error: '',
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.passwordChange = this.passwordChange.bind(this);
    }

    validateEmail (event: React.ChangeEvent<HTMLInputElement>): void {
        const input = event.target.value;
        const re = /\S+@\S+\.\S+/;
        this.setState(() =>  {
            return {
                emailState: input,
                emailValid: re.test(input)
            };
        });
    }

    passwordChange (event: React.ChangeEvent<HTMLInputElement>): void {
        const input = event.target.value;
        this.setState(() =>  {
            return {
                passwordState: input,
            };
        });
    }

    handleSubmit (event: React.FormEvent) {
        event.preventDefault();
        AppContext.postLoginForm(this.state.emailState, this.state.passwordState).then(
            (loginInfo: LoginInfo) => {
                if (loginInfo.user.verified) {
                    this.props.onLogIn();
                }
            }
            ).catch(
            (reason: any) => {
                if (reason.response && reason.response.data && reason.response.data.reason) {
                    console.log(reason.response.data.reason);
                    const transformedErr =  handleErrors(reason.response.data.reason);
                    this.setState(() => {
                        return {
                            error: transformedErr
                        };
                    });
                } else {
                console.error(reason);
                }
            }
        );
    }

    render() {
        if (this.props.isLoggedIn) {
            return (
              <Redirect to="/devices"/>
            );
        }
        return (
            <Fragment>
                <LoginHeader />
                <div className="login-section">
                    <h1 className="title">Welcome Back!</h1>
                    <p id="login-text">Your sensor data is just one log-in away</p>
                    <form className="form-group" onSubmit={this.handleSubmit}>
                        <input 
                            onChange={event => this.validateEmail(event)}
                            type="email" 
                            className="form-control"
                        />
                        <input 
                            onChange={event => this.passwordChange(event)}
                            type="password" 
                            className="form-control"
                        />
                        {
                        this.state.error !== '' &&
                            <div className="error-message-login">{this.state.error}</div>
                        }
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
