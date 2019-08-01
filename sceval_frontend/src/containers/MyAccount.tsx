import React, { Fragment, useState, useEffect } from 'react';
import LeftNav from '../components/LeftNav';
import { AppContext } from '../controllers/AppContext';
import { Redirect, withRouter, RouteComponentProps } from 'react-router';
import { Modal } from 'antd';

const email = require('../common_images/acct_email.svg');
const name = require('../common_images/acct_name.svg');
const password = require('../common_images/acct_password.svg');

interface HardwareProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}

const MyAccount = withRouter((props: HardwareProps & RouteComponentProps<any>) => {
  const [isEditing, setisEditing] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [passwordNew, setPasswordNew] = useState<string>('');
  const [passwordConfirm, setPasswordConfirm] = useState<string>('');
  const [formValid, setFormValid] = useState<boolean>(false);
  const [passwordUpdated, setPasswordUpdated] = useState<boolean>(false);

  useEffect(
    () => {
      const user = JSON.parse(`${localStorage.getItem('user-login')}`).value.user.name;
      setUsername(user);
    },
    []
  );

  const logout = () => {
    AppContext.clearLogin();
    setTimeout(
        () => {
        location.pathname = '/login';
        }, 
        1000);
  };

  const editUserInfo = (): void => {
    setisEditing(!isEditing);
  };

  const saveChanges = (event: React.FormEvent): void => {
    event.preventDefault();
    AppContext.restoreLogin();
    AppContext.UpdateUserInfo(username, passwordNew).then(
      (response: any) => {
        if (response.status === 204) {
          setPasswordUpdated(true);
          setisEditing(false);
        }
      }
    );
  };

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
    // setTimeout(
    //     () => {
    if (
        passwordConfirm === passwordNew &&
        passwordConfirm !== '' &&
        name !== ''
    ) {
      setFormValid(true);
    } else {
        setFormValid(false);
    }
        // }, 
        // 500);
  };

  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }
  const userData = JSON.parse(`${localStorage.getItem('user-login')}`);

  return (
    <div>
      <LeftNav />
      <div className="account-section">
        <div className="page-header">
          <h1>My Account</h1>
        </div>
        <div className="info-container">
          <div
            className={
              !isEditing
                ? 'user-info-section'
                : 'user-info-section edit-mode'
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
                    onClick={editUserInfo}
                    className="action-button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={event => saveChanges(event)}
                    disabled={!formValid}
                    className="action-button update-account"
                  >
                    Save Changes
                  </button>
                </Fragment>
              )}
            </h3>
            <img src={name} />
            <h4>Name:</h4>
            {!isEditing ? (
              <div className="user-data">{userData.value.user.name}</div>
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
            <img className="mail" src={email} />
            <h4> Email:</h4>
            {!isEditing ? (
              <div className="user-data">{userData.value.user.email}</div>
            ) : (
              <input
                type="text"
                className="user-data edit-box"
                value={userData.value.user.email}
                disabled={true}
                name="email"
              />
            )}
            <img src={password} />
            <h4>Password:</h4>
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
            <h3>Sign Out</h3>
            <button className="sign-out-button" onClick={logout}>
              Sign Out
            </button>
          </div>
        </div>
        <div className="footer">
          <a href="https://www.tinkermode.com/legal/tos.html" target="_blank">
            Terms of Service
          </a>
          <div>•</div>
          <a
            href="https://www.tinkermode.com/legal/privacy.html"
            target="_blank"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
});

export default MyAccount;
