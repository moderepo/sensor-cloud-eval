import React, { Component, Fragment } from 'react';
import LeftNav from '../components/LeftNav';
import { AppContext } from '../controllers/AppContext';
import { Redirect, withRouter, RouteComponentProps } from 'react-router';
import modeAPI from '../controllers/ModeAPI';

const email = require('../common_images/acct_email.svg');
const name = require('../common_images/acct_name.svg');
const password = require('../common_images/acct_password.svg');

interface HardwareProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

interface HardwareState {
    userInfo: Object;
    isEditing: boolean;
    name: string;
    passwordNew: string;
    passwordConfirm: string;
    formValid: boolean;
    passwordUpdated: boolean;
}
export class MyAccount extends Component<HardwareProps & RouteComponentProps<any>, HardwareState> {
    constructor(props: HardwareProps & RouteComponentProps<any>) {
        super(props);
        this.state = {
            userInfo: {},
            isEditing: false,
            name: '',
            passwordNew: '',
            passwordConfirm: '',
            formValid: false,
            passwordUpdated: false
        };
        this.editUserInfo = this.editUserInfo.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    componentDidMount() {
        const username = JSON.parse(`${localStorage.getItem('user-login')}`).value.user.name;
        this.setState(() => {
            return {
                name: username
            };
        });
    }
    logout() {
        AppContext.clearLogin();  
        setTimeout(
            () => {
                location.pathname = '/login';
            },
            1000
        );
    }

    editUserInfo(): void {
        this.setState(() => {
            return {
                isEditing: !this.state.isEditing
            };
        });
    }

    saveChanges(): void {
        AppContext.restoreLogin();
        AppContext.UpdateUserInfo(this.state.name, this.state.passwordNew).then((response: any) =>  {
            if (response.status === 204) {
                this.setState(() => {
                    return {
                        passwordUpdated: true,
                        isEditing: false
                    };
                });
            }
        });
    }

    handleInputChange(event: React.FormEvent<HTMLElement>): void {
        const target = event.target as HTMLInputElement;
        const input = target.value;
        this.setState({
            ...this.state,
            [target.name]: input,
        });
        setTimeout(
            () => {
                if (this.state.passwordConfirm === this.state.passwordNew
                    && this.state.passwordConfirm  !== '' &&
                    this.state.name !== '') {
                        this.setState(() => {
                            return {
                                formValid: true
                            };
                        });
                    } else {
                        this.setState(() => {
                            return {
                                formValid: false
                            };
                        });
                    }
            },
            1000
        );
    }

    convertedPass(userPass: string): string {
        let convertedPass = '';
        for (let i = 0; i < password.length; i++) {
            convertedPass += '•';
        }
        return convertedPass;
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
                        <div 
                            className={!this.state.isEditing ? 
                            'user-info-section' :
                            'user-info-section edit-mode'
                            }
                        >
                            <h3>User Info 
                                { !this.state.isEditing ?
                                <button 
                                    className="action-button"
                                    onClick={this.editUserInfo}
                                >Edit
                                </button>
                                :
                                <Fragment>
                                    <button
                                        onClick={this.editUserInfo}
                                        className="action-button"
                                    >Cancel
                                    </button>
                                    <button
                                        onClick={this.saveChanges}
                                        disabled={!this.state.formValid}
                                        className="action-button"
                                    >Save Changes
                                    </button>
                                </Fragment>
                                }
                            </h3>
                            <img src={name} />
                            <h4>Name:</h4>
                            { !this.state.isEditing ?
                                <div className="user-data">{userInfo.value.user.name}</div> :
                                <input 
                                    type="text" 
                                    className="user-data edit-box"
                                    value={this.state.name}
                                    name="name"
                                    onChange={event => this.handleInputChange(event)}
                                    onBlur={event => this.handleInputChange(event)}
                                />
                            }
                            <img className="mail" src={email} />
                            <h4> Email:</h4>
                            { !this.state.isEditing ?
                                <div className="user-data">{userInfo.value.user.email}</div> :
                                <input 
                                    type="text" 
                                    className="user-data edit-box" 
                                    value={userInfo.value.user.email}
                                    disabled={true}
                                    name="email"
                                />
                            }
                            <img src={password} /> 
                            <h4>
                                Password:
                            </h4>
                            { !this.state.isEditing ?
                                <div 
                                    className="user-data"
                                >•••••••••
                                </div> :
                                <Fragment>
                                    <input 
                                        type="password" 
                                        className="user-data edit-box" 
                                        value={this.state.passwordNew}
                                        name="passwordNew"
                                        onChange={event => this.handleInputChange(event)}
                                        onBlur={event => this.handleInputChange(event)}
                                    />
                                    <input 
                                        type="password" 
                                        className="user-data edit-box" 
                                        value={this.state.passwordConfirm}
                                        name="passwordConfirm"
                                        onChange={event => this.handleInputChange(event)}
                                        onBlur={event => this.handleInputChange(event)}
                                    />
                                </Fragment>
                            }
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

export default withRouter(MyAccount);
