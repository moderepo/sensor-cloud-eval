import React, { Fragment, useState } from 'react';
import { NavLink, Redirect } from 'react-router-dom';
import LoginHeader from '../components/LoginHeader';
import { AppContext } from '../controllers/AppContext';
import handleErrors from '../utils/ErrorMessages';
import { ErrorResponse } from '../components/entities/API';
import { LoginInfo } from '../components/entities/User';

interface LoginProps extends React.Props<any> {
  onLogIn: () => void;
  isLoggedIn: boolean;
}

const Login: React.FC<LoginProps> = (props: LoginProps) => {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [emailValid, setEmailValid] = useState(false),
    [error, setError] = useState('');

  // Validation method for checking email
  const validateEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    const re = /\S+@\S+\.\S+/;
    setEmail(input);
    setEmailValid(re.test(input));
  };
  // password-update handler on user-input change
  const passwordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value;
    setPassword(input);
  };
  // submit handler for form
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    AppContext.postLoginForm(email, password)
      .then((loginInfo: LoginInfo) => {
        if (loginInfo.user.verified) {
          props.onLogIn();
        }
      })
      .catch((errorResponse: ErrorResponse) => {
        const transformedErr = handleErrors(errorResponse.message);
        setError(transformedErr);
      });
  };
  // if the user is already logged in, prevent them from accessing login
  if (props.isLoggedIn) {
    return <Redirect to="/devices" />;
  }
  return (
    <Fragment>
      <LoginHeader />
      <div className="login-section">
        <h1 className="title">Welcome Back!</h1>
        <p id="login-text">Your sensor data is just one log-in away</p>
        <form className="form-group" onSubmit={handleSubmit}>
          <input
            onChange={event => validateEmail(event)}
            type="email"
            className="form-control"
          />
          <input
            onChange={event => passwordChange(event)}
            type="password"
            className="form-control"
          />
          {error !== '' && <div className="error-message-login">{error}</div>}
          <button
            type="submit"
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
        <div className="dont-have-account">
          <p>
            {`Don't have an acount yet? `}
            <NavLink to="/register" className="navlinks">
              Sign Up!
            </NavLink>
          </p>
          <p>or</p>
          <NavLink to="/reset_password" className="navlinks">
            Forgot Password?
          </NavLink>
        </div>
      </div>
    </Fragment>
  );
};

export default Login;
