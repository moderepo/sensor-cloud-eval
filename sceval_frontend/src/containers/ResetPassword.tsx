import React, { Fragment, useState } from 'react';
import LoginHeader from '../components/LoginHeader';
import { NavLink } from 'react-router-dom';
import { AppContext } from '../controllers/AppContext';
import modeAPI, { ErrorResponse } from '../controllers/ModeAPI';

const emailSent = require('../common_images/email_sent.svg');

const ResetPassword: React.FC = () => {
    const [input, setInput] = useState(''),
        [emailValid, setEmailValid] = useState(false),
        [isSent, setIsSent] = useState(false),
        [error, setError] = useState('');
    const onTxtEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const re = /\S+@\S+\.\S+/;
        setInput(value);
        setEmailValid(re.test(value));
    };
    const onSubmit = (event: React.FormEvent<HTMLElement>) => {
        event.preventDefault();
        modeAPI.resetPassword(AppContext.getProjectId(), input)
        .then((status: number) => {
            setIsSent(true);
            setError('');
        })
        .catch((errorRsponse: ErrorResponse) => {
            setError(
                errorRsponse.message ? errorRsponse.message : 'Error'
            );
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
                    {!isSent ? (
                        <p id="login-text">
                            To reset your password, enter the email address you
                            use to sign in.
                        </p>
                    ) : (
                        <p id="login-text">
                            We just sent an email to you. Click the link in the
                            email to reset your password.
                        </p>
                    )}
                    {!isSent ? (
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
                    ) : (
                        <img src={emailSent} />
                    )}
                    {!isSent && (
                        <Fragment>
                            <NavLink to="/login" className="navlinks">
                                Go Back
                            </NavLink>
                            <div className="error">{error}</div>
                        </Fragment>
                    )}
                </div>
            </div>
            }
        </Fragment>
    );
};

export default ResetPassword;
