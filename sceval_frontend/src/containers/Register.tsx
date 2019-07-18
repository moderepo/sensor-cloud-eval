import React, { Component, Fragment } from 'react';
import LoginHeader from '../components/LoginHeader';
import { NavLink } from 'react-router-dom';
import { AxiosRequestConfig, AxiosInstance } from 'axios';
import modeAPI from '../controllers/ModeAPI';
import AppContext from '../controllers/AppContext';

export interface RegisterState {
  nameState: string;
  emailState: string;
  passwordState: string;
  confirmPasswordState: string;
  passwordsMatch: boolean;
  emailValid: boolean;
  formValid: boolean;
  isSent: boolean;
  error: string;
}

export class Register extends Component<any, RegisterState> {
  constructor(props: any) {
    super(props);
    this.state = {
      nameState: '',
      emailState: '',
      passwordState: '',
      confirmPasswordState: '',
      passwordsMatch: false,
      emailValid: false,
      formValid: false,
      isSent: false,
      error: ''
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    const input = target.value;
    const re = /\S+@\S+\.\S+/;
    this.setState({
        ...this.state,
        [target.name]: input,
        emailValid: target.name === 'emailState' ?
            re.test(input) :  this.state.emailValid
    });
    setTimeout(
        () => {
            if (this.state.passwordState === this.state.confirmPasswordState &&
                this.state.passwordState !== '' && this.state.emailValid && 
                this.state.nameState !== '') {
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
        500
    );
  }

  onSubmit(event: React.FormEvent<HTMLElement>) {
    event.preventDefault();
      
  }

  render() {
    return (
      <Fragment>
        <LoginHeader />
        <div>
          <div className="register-section">
            <h1 className="title">
              Create an account on MODE Sensor Cloud Eval
            </h1>
            <form
              className="form-group"
              onSubmit={this.onSubmit}
            >
              <div>
                <input
                  className="form-control"
                  required={true}
                  name="nameState"
                  type="text"
                  placeholder="Name"
                  value={this.state.nameState}
                  onChange={this.onInputChange}
                  onBlur={this.onInputChange}
                />
                <input
                  className="form-control"
                  required={true}
                  name="emailState"
                  type="email"
                  placeholder="Email"
                  value={this.state.emailState}
                  onChange={this.onInputChange}
                  onBlur={this.onInputChange}
                />
                <input
                  className="form-control"
                  name="passwordState"
                  required={true}
                  type="password"
                  placeholder="Password"
                  value={this.state.passwordState}
                  onChange={this.onInputChange}
                  onBlur={this.onInputChange}
                />
                <input
                  className="form-control"
                  name="confirmPasswordState"
                  required={true}
                  type="password"
                  placeholder="Confirm Password"
                  value={this.state.confirmPasswordState}
                  onChange={this.onInputChange}
                  onBlur={this.onInputChange}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className={
                    this.state.formValid
                      ? 'btn btn-primary btn-large'
                      : 'btn btn-primary btn-large disabled'
                  }
                  disabled={this.state.formValid ? false : true}
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>
          {/* {this.getDoneElement(this.state.isSent)} */}
          <div className="error">{/* {this.getErrorChild()} */}</div>
        </div>
        <div className="agreement-account-status">
          <p>
            {`By signing up, you indicate that you have read and agree to the `}
            <a
              href="https://www.tinkermode.com/legal/tos.html"
              target="_blank"
              className="navlinks"
            >
              Terms of Service
            </a>
            {` and `}
            <a
              href="https://www.tinkermode.com/legal/privacy.html"
              target="_blank"
              className="navlinks"
            >
              Privacy Policy
            </a>.
          </p>
          <p>
            {`Already have an account? `}
            <NavLink to="/login" className="navlinks">
              Sign Up!
            </NavLink>
          </p>
        </div>
      </Fragment>
    );
  }
}

export default Register;
