import React, { Fragment, useState } from 'react';
import LoginHeader from '../components/LoginHeader';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import { ErrorResponse } from '../components/entities/API';
// required images imported
const emailSent = require('../common_images/email_sent.svg');

const ResetPassword: React.FC = () => {
  // email input state
  const [input, setInput] = useState<string>(''),
    // email validity state
    [emailValid, setEmailValid] = useState<boolean>(false),
    // email sent or not state
    [isSent, setIsSent] = useState<boolean>(false),
    // error on submission state
    [error, setError] = useState<string>('');
  // handler for email change and validity
  const onTxtEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const re = /\S+@\S+\.\S+/;
    setInput(value);
    setEmailValid(re.test(value));
  };
  // handler for on submit of reset password form
  const onSubmit = (event: React.FormEvent<HTMLElement>) => {
    // prevent reload of page
    event.preventDefault();
    // reset the password
    modeAPI
      .resetPassword(AppContext.getProjectId(), input)
      .then((status: number) => {
        setIsSent(true);
        setError('');
      })
      .catch((errorRsponse: ErrorResponse) => {
        setError(errorRsponse.message ? errorRsponse.message : 'Error');
      });
  };

  return (
    <Fragment>
      <LoginHeader />
      <div>
        <div className="pass-reset-section">
          <h1 className="title">
            {!isSent ? 'Password Reset' : 'Email sent.'}
          </h1>
          {!isSent ?
          // if no email has been sent yet:
          (
            <p id="login-text">
              To reset your password, enter the email address you use to sign
              in.
            </p>
          ) : 
          // if email has been sent:
          (
            <p id="login-text">
              We just sent an email to you. Click the link in the email to reset
              your password.
            </p>
          )}
          {!isSent ?
          // if no email has been sent yet:
          (
            <form className="form-group" onSubmit={onSubmit}>
              <div>
                <input
                  className="form-control"
                  required={true}
                  type="email"
                  placeholder="Email address*"
                  value={input}
                  onChange={onTxtEmailChange}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className={
                    emailValid
                      ? 'btn btn-primary btn-large'
                      : 'btn btn-primary btn-large disabled'
                  }
                  disabled={emailValid ? false : true}
                >
                  Reset Password
                </button>
              </div>
            </form>
          ) : 
          // if email has been sent:
          (
            <img src={emailSent} />
          )}
          {!isSent &&
          // if no email has been sent yet:
          (
            <Fragment>
              <NavLink to="/login" className="navlinks">
                Go Back
              </NavLink>
              <div className="error">{error}</div>
            </Fragment>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default ResetPassword;
