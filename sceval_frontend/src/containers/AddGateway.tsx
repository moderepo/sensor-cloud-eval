import React, { useState, useEffect } from 'react';
import { withRouter, RouteComponentProps, NavLink } from 'react-router-dom';
import { Input, Button } from 'antd';
import { LoginInfo } from '../components/entities/User';
import AppContext from '../controllers/AppContext';
import { Home } from '../components/entities/API';
import modeAPI from '../controllers/ModeAPI';

const connect = require('../common_images/devices/1-plug.svg');
const gw = require('../common_images/devices/gateway-large.svg');
const numbers = require('../common_images/devices/numbers.svg');

const AddGateway = withRouter((props: RouteComponentProps) => {
  const [home, setHome] = useState<number>();
  const [claimCode, setClaimCode] = useState<string>();
  const [addDeviceError, setAddDeviceError] = useState<boolean>(false);

  const initialize = async () => {
    const loginInfo: LoginInfo = await AppContext.restoreLogin();
    // get home associated with project
    const homeObj: Home = await modeAPI.getHome(loginInfo.user.id);
    setHome(homeObj.id);
  };

  useEffect(() => {
    initialize();
  },        []);

  const submitClaimCode = async () => {
    try {
      if (home && claimCode) {
        const status = await modeAPI.addDevice(home, claimCode);
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
  };

  const handleClaimCodeEntry = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setClaimCode(event.target.value);
  };

  return (
    <div className="add-gateway-section">
      <div className="directions">
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">1</span>
            <p>Make sure your device is connected to power and wifi.</p>
          </div>
          <img className="direction-image" src={connect} />
        </div>
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">2</span>
            <p>Turn your device into claim mode.</p>
          </div>
          <img className="direction-image" src={gw} />
        </div>
        <div className="direction-set">
          <div className="number-text">
            <span className="circled-number">3</span>
            <p>
              Enter the claim code found on your device and click 'Add' to add
              the device.
            </p>
          </div>
          <img className="direction-image" src={numbers} />
        </div>
        {addDeviceError && (
          <div className="warning-animation fade-out">
            Failed to add gateway. Please check your claim code and try again.
          </div>
        )}
        <div className="claim-code-entry">
          <Input
            placeholder="Claim code"
            value={claimCode}
            onChange={handleClaimCodeEntry}
          />
        </div>
        <div className="claim-code-section">
          <Button
            className="add-button"
            onClick={() => submitClaimCode()}
            disabled={claimCode === ''}
          >
            Add
          </Button>
          <NavLink to="/devices" className="back-to-hardware">
            Back
          </NavLink>
        </div>
      </div>
    </div>
  );
});

export default AddGateway;
