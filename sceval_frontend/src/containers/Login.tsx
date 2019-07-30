import React, { Fragment, useState } from 'react';
import { NavLink, Redirect } from 'react-router-dom';
import LoginHeader from '../components/LoginHeader';
import { AppContext, LoginInfo } from '../controllers/AppContext';
import handleErrors from '../utils/ErrorMessages';

interface LoginProps extends React.Props<any> {
    onLogIn: () => void;
    isLoggedIn: boolean;
}

const Login: React.FC<LoginProps> = (props: LoginProps) => {
    const [email, setEmail] = useState(''),
        [password, setPassword] = useState(''),
        [emailValid, setEmailValie] = useState(false),
        [error, setError] = useState('');
    const validateEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value;
        const re = /\S+@\S+\.\S+/;
        setEmail(input);
        setEmailValie(re.test(input));
    };
    const passwordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target.value;
        setPassword(input);
    };
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        AppContext.postLoginForm(email, password)
            .then((loginInfo: LoginInfo) => {
                if (loginInfo.user.verified) {
                    props.onLogIn();
                }
            })
            .catch((reason: any) => {
                if (
                    reason.response &&
                    reason.response.data &&
                    reason.response.data.reason
                ) {
                    console.log(reason.response.data.reason);
                    const transformedErr = handleErrors(
                        reason.response.data.reason
                    );
                    setError(transformedErr);
                } else {
                    console.error(reason);
                }
            });
    };

    if (props.isLoggedIn) {
        return <Redirect to='/hardware' />;
    }
    return (
        <Fragment>
            <LoginHeader />
            <div className='login-section'>
                <h1 className='title'>Welcome Back!</h1>
                <p id='login-text'>Your sensor data is just one log-in away</p>
                <form className='form-group' onSubmit={handleSubmit}>
                    <input
                        onChange={event => validateEmail(event)}
                        type='email'
                        className='form-control'
                    />
                    <input
                        onChange={event => passwordChange(event)}
                        type='password'
                        className='form-control'
                    />
                    {error !== '' && (
                        <div className='error-message-login'>{error}</div>
                    )}
                    <button
                        type='submit'
                        className={
                            emailValid
                                ? 'btn btn-primary btn-large'
                                : 'btn btn-primary btn-large disabled'
                        }
                        disabled={!emailValid}
                    >
                        Log In
                    </button>
                </form>
                <div className='dont-have-account'>
                    <p>
                        {`Don't have an acount yet? `}
                        <NavLink to='/register' className='navlinks'>
                            Sign Up!
                        </NavLink>
                    </p>
                    <p>or</p>
                    <NavLink to='/reset_password' className='navlinks'>
                        Forgot Password?
                    </NavLink>
                </div>
            </div>
        </Fragment>
    );
};

export default Login;
