import React from 'react';
import LoginHeader from '../components/LoginHeader';

const emailSent = require('../common_images/email_sent.svg');
const EmailSent = () => {
    return (
        <div>
            <LoginHeader />
            <div className="register-section">
                <h1 className="title">
                    You're signed up! Please verify your account.
                </h1>
                <img src={emailSent} />
                <p>
                    We just sent a confirmation email to you. Click the link in
                    the email to verify your account and get started.
                </p>
            </div>
        </div>
    );
};
export default EmailSent;
