import React from 'react';
// import required images
import modeLogo from '../common_images/logos/mode-logo-dark.svg';

const LoginHeader: React.FC = () => {
  return (
    <div className="login-header">
      <img src={modeLogo} className="login-mode-logo" alt="mode logo"/>
      <h1 className="title">MODE SENSOR CLOUD</h1>
      <hr />
    </div>
  );
};

export default LoginHeader;
