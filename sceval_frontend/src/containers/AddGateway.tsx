import React, { useState, useEffect } from 'react';
import { withRouter, RouteComponentProps, NavLink } from 'react-router-dom';
import { Input } from 'antd';
import { LoginInfo } from '../components/entities/User';
import { Home } from '../components/entities/API';
import modeAPI from '../controllers/ModeAPI';
import { useCheckUserLogin, useLoadUserHome } from '../utils/CustomHooks';
// required images imported
const connect = require('../common_images/devices/1-plug.svg');
const gw = require('../common_images/devices/gateway-large.svg');
const numbers = require('../common_images/devices/numbers.svg');

const AddGateway = withRouter((props: RouteComponentProps) => {
  // Get user login info
  const loginInfoState = useCheckUserLogin();
  // stores the associated home
  const loadHomeState = useLoadUserHome(loginInfoState.loginInfo);

  // stores the state of the claim code being typed
  const [claimCode, setClaimCode] = useState<string>('');
  // stores any device errors that may occur when submitting the claim code
  const [addDeviceError, setAddDeviceError] = useState<boolean>(false);

  /**
   * Check loginInfoState for error. If there is an error, take user to login
   */
  useEffect(() => {
    if (loginInfoState.error) {
      props.history.push('/login');
    }
  },        [props.history, loginInfoState.error]);

  /**
   * Method for handling the submission of a claim code. 
   * If an error occurs, the method will catch the error and handle it accordingly.
   */
  const submitClaimCode = async (event?: React.KeyboardEvent<HTMLInputElement>) => {
    // if the event exists, and  the event key corresponds to enter, or method invoked by click:
    if ((event && event.key === 'Enter') || !event) {
      try {
        if (loadHomeState.home && claimCode) {
          const status = await modeAPI.addDevice(loadHomeState.home.id, claimCode);
          if (status === 201) {
            setAddDeviceError(false);
            setClaimCode('');
            props.history.push('/devices');
          }
        }
      } catch (error) {
        setAddDeviceError(true);
        setTimeout(() => {
          setAddDeviceError(false);
        },         2000);
      }
    }
  };
  /**
   * Method updating the state of the claim code.
   * @param event 
   */
  const handleClaimCodeEntry = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setClaimCode(event.target.value);
  };

  return (
    <>
    <div className="add-gateway-section">
      <h1 className="page-header add-gateway-header">Add Gateway</h1>
      <div className="directions">
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">1</span>
            <p>Make sure your device is connected to power and wifi.</p>
          </div>
          <img className="direction-image" src={connect} alt="direction icon"/>
        </div>
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">2</span>
            <p>Turn your device into claim mode.</p>
          </div>
          <img className="direction-image" src={gw} alt="direction icon"/>
        </div>
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">3</span>
            <p>
              Enter the claim code found on your device and click 'Add' to add
              the device.
            </p>
          </div>
          <img className="direction-image" src={numbers} alt="direction icon"/>
        </div>
        {addDeviceError && (
          <div className="warning-animation fade-out">
            Failed to add gateway. Please check your claim code and try again.
          </div>
        )}
        <div className="claim-code-entry">
          <Input
            placeholder="Claim code"
            onKeyDown={e => submitClaimCode(e)}
            value={claimCode}
            onChange={handleClaimCodeEntry}
          />
        </div>
        <div className="claim-code-section">
        <NavLink to="/devices" className="back-to-hardware">
            Cancel
          </NavLink>
          <button
            className="action-button"
            onClick={() => submitClaimCode()}
            disabled={claimCode === ''}
          >
            Add
          </button>
        </div>
      </div>
    </div>
    </>
  );
});

export default AddGateway;
