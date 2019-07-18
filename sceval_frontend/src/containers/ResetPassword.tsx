import React, { Component, Fragment } from 'react';
import LoginHeader from '../components/LoginHeader';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
const emailSent = require('../common_images/email_sent.svg');

export interface EmailResetPasswordState {
  inputState: string;
  emailValid: boolean;
  isSent: boolean;
  error: string;
}

export class ResetPassword extends Component<any, EmailResetPasswordState> {
  constructor(props: any) {
    super(props);
    this.state = {
      inputState: '',
      emailValid: false,
      isSent: false,
      error: ''
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onTxtEmailChange = this.onTxtEmailChange.bind(this);
  }

  onTxtEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target.value;
    const re = /\S+@\S+\.\S+/;
    this.setState(() => {
      return {
        inputState: input,
        emailValid: re.test(input)
      };
    });
  }

  onSubmit(event: React.FormEvent<HTMLElement>) {
    const data: { projectId: number; email: string } = {
      projectId: AppContext.getProjectId(),
      email: this.state.inputState
    };

    modeAPI
      .request<any>('POST', 'https://api.tinkermode.com/auth/user/passwordReset/start', data)
      .then(() => {
        this.setState((state: EmailResetPasswordState, props: any) => {
          return {
            isSent: true,
            error: ''
          };
        });
      })
      .catch((value: any) => {
        this.setState((state: EmailResetPasswordState, props: any) => {
          return {
            error: value.response.data ? value.response.data.reason : 'Error'
          };
        });
      });
    event.preventDefault();
  }

  getDoneElement(isSent: boolean) {
    return isSent ? (
      <div>
        We just sent an email to you. Click the link in the email to reset your
        password.
      </div>
    ) : null;
  }

  render() {
    return (
      <Fragment>
        <LoginHeader />
        <div>
          <div className="pass-reset-section">
            <h1 className="title">
              {!this.state.isSent ? 'Password Reset' : 'Email sent.'}
            </h1>
            {!this.state.isSent ? (
              <p id="login-text">
                To reset your password, enter the email address you use to sign
                in.
              </p>
            ) : (
              <p id="login-text">
                We just sent an email to you. Click the link in the email to
                reset your password.
              </p>
            )}
            {!this.state.isSent ? (
              <form className="form-group" onSubmit={this.onSubmit}>
                <div>
                  <input
                    className="form-control"
                    required={true}
                    type="email"
                    placeholder="Email address*"
                    value={this.state.inputState}
                    onChange={this.onTxtEmailChange}
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className={
                      this.state.emailValid
                        ? 'btn btn-primary btn-large'
                        : 'btn btn-primary btn-large disabled'
                    }
                    disabled={this.state.emailValid ? false : true}
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            ) : (
              <img src={emailSent} />
            )}
            {!this.state.isSent && (
              <Fragment>
                <NavLink to="/login" className="navlinks">
                  Go Back
                </NavLink>
                <div className="error">{this.state.error}</div>
              </Fragment>
            )}
          </div>
        </div>
        }
      </Fragment>
    );
  }
}

export default ResetPassword;
