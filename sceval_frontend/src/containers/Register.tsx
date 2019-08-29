import React, { Fragment, useState } from 'react';
import LoginHeader from '../components/LoginHeader';
import { NavLink, Redirect } from 'react-router-dom';
import modeAPI from '../controllers/ModeAPI';
import { ErrorResponse } from '../components/entities/API';
import AppContext from '../controllers/AppContext';
import handleErrors from '../utils/ErrorMessages';
import { User } from '../components/entities/User';
// declare RegisterProps interface for determining logged in status
interface RegisterProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

const Register: React.FC<RegisterProps> = (props: RegisterProps) => {
    const [name, setName] = useState(''), // name state
        [email, setEmail] = useState(''), // email state
        [password, setPassword] = useState(''), // password state
        [confirmPassword, setConfirmPassword] = useState(''), // password confirm state
        [
            isRedirectConfirmEmailVerification,
            setIsRedirectConfirmEmailVerification
        ] = useState(false), // redirect state
        [emailValid, setEmailValid] = useState(false), // email validity state
        [formValid, setFormValid] = useState(false), // form validity state
        [error, setError] = useState(''); // error state

    // method for handling form submission
    const onSubmit = (event: React.FormEvent<HTMLElement>) => {
        // prevent reload
        event.preventDefault();
        // register user
        modeAPI.registerUser(AppContext.getProjectId(), name, email, password)
            .then((userInfo: User) => {
                setIsRedirectConfirmEmailVerification(true);
            })
            .catch((errorResponse: ErrorResponse) => {
                console.log(errorResponse.message);
                const transformedErr = handleErrors(
                    errorResponse.message
                );
                setError(transformedErr);
            });
    };
    // handler for evaluating form validity
    const setValidationTimer = () => {
        const re = /\S+@\S+\.\S+/;
        setEmailValid(re.test(email));
        setTimeout(() => {
            // if the form meets these requirements, set form validity to true
            if (
                password === confirmPassword &&
                password !== '' &&
                emailValid &&
                name !== ''
            ) {
                setFormValid(true);
            // otherwise set form validity to false
            } else {
                setFormValid(false);
            }
        },         500);
    };
    // determine the button css depending on validity of the form
    const getSubmitButtonClassName = (isValid: boolean): string => {
        return isValid
            ? 'btn btn-primary btn-large'
            : 'btn btn-primary btn-large disabled';
    };
    // if the user is logged in, redirect to hardware
    if (props.isLoggedIn) {
        return <Redirect to="/hardware" />;
    }
    // if email verification is true, send the user to the email_sent route
    if (isRedirectConfirmEmailVerification) {
        return <Redirect to="/email_sent" />;
    }
    
    return (
        <Fragment>
            <LoginHeader />
            <div>
                <div className="register-section">
                    <h1 className="title">
                        Create an account on MODE Sensor Cloud Eval
                    </h1>
                    <form className="form-group" onSubmit={onSubmit}>
                        <div>
                            <input
                                className="form-control"
                                required={true}
                                name="name"
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    setValidationTimer();
                                }}
                                onBlur={e => {
                                    setName(e.target.value);
                                    setValidationTimer();
                                }}
                            />
                            <input
                                className="form-control"
                                required={true}
                                name="email"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setValidationTimer();
                                }}
                                onBlur={e => {
                                    setEmail(e.target.value);
                                    setValidationTimer();
                                }}
                            />
                            <input
                                className="form-control"
                                name="password"
                                required={true}
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={e => {
                                    setPassword(e.target.value);
                                    setValidationTimer();
                                }}
                                onBlur={e => {
                                    setPassword(e.target.value);
                                    setValidationTimer();
                                }}
                            />
                            <input
                                className="form-control"
                                name="confirmPassword"
                                required={true}
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={e => {
                                    setConfirmPassword(e.target.value);
                                    setValidationTimer();
                                }}
                                onBlur={e => {
                                    setConfirmPassword(e.target.value);
                                    setValidationTimer();
                                }}
                            />
                        </div>
                        <div>
                            {error !== null && (
                                <div className="error-message-login">
                                    {error}
                                </div>
                            )}
                            <button
                                type="submit"
                                className={getSubmitButtonClassName(formValid)}
                                disabled={!formValid}
                            >
                                Sign Up
                            </button>
                        </div>
                    </form>
                </div>
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
                    </a>
                    .
                </p>
                <p>
                    {`Already have an account? `}
                    <NavLink to="/login" className="navlinks">
                        Sign In!
                    </NavLink>
                </p>
            </div>
        </Fragment>
    );
};

export default Register;
