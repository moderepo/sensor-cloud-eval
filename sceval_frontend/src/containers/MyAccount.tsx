import React, { Fragment, useState, useEffect, useContext } from 'react';
import { AppContext } from '../controllers/AppContext';
import { Context, context } from '../context/Context';
import { Redirect, withRouter, RouteComponentProps } from 'react-router';
// required images imported
const email = require('../common_images/user/acct_email.svg');
const name = require('../common_images/user/acct_name.svg');
const password = require('../common_images/user/acct_password.svg');

interface HardwareProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}

const MyAccount = withRouter(
  (props: HardwareProps & RouteComponentProps<any>) => {
    const [isEditing, setisEditing] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [passwordNew, setPasswordNew] = useState<string>('');
    const [passwordConfirm, setPasswordConfirm] = useState<string>('');
    const [formValid, setFormValid] = useState<boolean>(false);
    const [updated, setUpdated] = useState<boolean>(false);
    const [updateError, setUpdateError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    const appContext: Context = useContext(context);

    // get user information on component mount
    useEffect(() => {
      const userInfo = appContext.state.userData;
      if (username !== '') {
        setUsername(username);
      } else {
        if (userInfo) {
          setUsername(userInfo.user.name);
        }
      }
    },        [isEditing, appContext.state.userData, username]);
    // logout method on click of "Logout button"
    const logout = async () => {
      try {
        // need to wait until log out is done before redirecting the user or
        // else the API call might be canceled.
        await AppContext.logout(true);
      } catch (error) {
        console.log(error);
      }
      setTimeout(() => {
        window.location.pathname = '/login';
      },         1000);
    };
    // toggle editing vs. non-editing mode handler
    const editUserInfo = (): void => {
      setisEditing(!isEditing);
      setUpdateError(false);
      setErrorMessage('');
      setUpdated(false);
    };
    // updating changes made to user information on submit handler
    const saveChanges = async (event: React.FormEvent) => {
      try {
        event.preventDefault();
        AppContext.restoreLogin();
        if (passwordNew === '') {
          const status: number = await AppContext.changeUserName(username);
          if (status === 204) {
            appContext.actions.setUsername(username);
            setUsername(username);
            setUpdated(true);
            setisEditing(false);
          }
        } else {
          const status: number = await AppContext.UpdateUserInfo(
            username,
            passwordNew
          );
          if (status === 204) {
            setUsername(username);
            setUpdated(true);
            setisEditing(false);
          }
        }
        setTimeout(() => {
          setUpdated(false);
        },         2000);
      } catch (error) {
        if (error.message === 'PASSWORD_TOO_SHORT') {
          setErrorMessage('Password is too short.');
        }
        setUpdateError(true);
      }
    };
    // handler for text change for name or password
    const handleInputChange = (event: React.FormEvent<HTMLElement>): void => {
      const target = event.target as HTMLInputElement;
      const input = target.value;
      switch (target.name) {
        case 'name':
          setUsername(input);
          break;
        case 'passwordNew':
          setPasswordNew(input);
          break;
        case 'passwordConfirm':
          setPasswordConfirm(input);
          break;
        default:
          break;
      }
      // if the username is new and not blank:
      const userName = JSON.parse(`${localStorage.getItem('user-login')}`).value
        .user.name;
      if (
        target.name === 'name' &&
        target.value !== '' &&
        target.value !== userName
      ) {
        setFormValid(true);
      } else {
        // otherewise set form to false
        setFormValid(false);
      }
      if (
        (target.name === 'passwordNew' || target.name === 'passwordConfirm') &&
        passwordConfirm === passwordNew &&
        passwordConfirm !== '' &&
        passwordNew !== ''
      ) {
        setFormValid(true);
      } else if (target.value === '' || target.value === userName) {
        setFormValid(false);
      }
    };
    // if the user isn't logged in, redirect them to login
    if (!props.isLoggedIn) {
      return <Redirect to="/login" />;
    }

    const userData = JSON.parse(`${localStorage.getItem('user-login')}`);

    return (
      <div>
        <div className="account-section">
          <h1 className="page-header">My Account</h1>
          <div className="info-container">
            <div
              className={
                !isEditing ? 'user-info-section' : 'user-info-section edit-mode'
              }
            >
              <h3>
                User Info
                {!isEditing ? (
                  <button className="action-button" onClick={editUserInfo}>
                    Edit
                  </button>
                ) : (
                  <Fragment>
                    <button
                      onClick={event => saveChanges(event)}
                      disabled={!formValid}
                      className="action-button update-account"
                    >
                      Save Changes
                    </button>
                    <button onClick={editUserInfo} className="cancel-button">
                      Cancel
                    </button>
                  </Fragment>
                )}
              </h3>
              <div
                className={
                  updateError
                    ? 'warning-animation fade-out'
                    : updated
                    ? 'save-animation fade-out'
                    : ''
                }
              >
                {updated && !isEditing
                  ? 'Successfully updated.'
                  : updateError ?
                  errorMessage !== '' ? errorMessage : 
                  'There was an error updating your information.' : ''
                }
              </div>
              <img src={name} alt="user icon"/>
              <h4>Name</h4>
              {!isEditing ? (
                <div className="user-data">{username}</div>
              ) : (
                <input
                  type="text"
                  className="user-data edit-box"
                  value={username}
                  name="name"
                  onChange={event => handleInputChange(event)}
                  onBlur={event => handleInputChange(event)}
                />
              )}
              <img className="mail" src={email} alt="email icon"/>
              <h4> Email</h4>
              <div className="user-data">{userData.value.user.email}</div>
              <img src={password} alt="password icon"/>
              <h4>Password</h4>
              {!isEditing ? (
                <div className="user-data">•••••••••</div>
              ) : (
                <Fragment>
                  <input
                    type="password"
                    className="user-data edit-box"
                    value={passwordNew}
                    name="passwordNew"
                    onChange={event => handleInputChange(event)}
                    onBlur={event => handleInputChange(event)}
                  />
                  <input
                    type="password"
                    className="user-data edit-box"
                    value={passwordConfirm}
                    name="passwordConfirm"
                    onChange={event => handleInputChange(event)}
                    onBlur={event => handleInputChange(event)}
                  />
                </Fragment>
              )}
            </div>
            <div className="sign-out-section">
              <button className="sign-out-button" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default MyAccount;
