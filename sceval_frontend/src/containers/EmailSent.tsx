import React from 'react';
import LoginHeader from '../components/LoginHeader';
// required images imported
const emailSent = require('../common_images/notifications/email_sent.svg');

const EmailSent: React.FC = () => {
    return (
        <div>
            <LoginHeader />
            <div className="register-section">
                <h1 className="title">
                    You're signed up! Please verify your account.
                </h1>
                <img src={emailSent} alt="Email sent star"/>
                <p>
                    We just sent a confirmation email to you. Click the link in
                    the email to verify your account and get started.
                </p>
            </div>
        </div>
    );
};
export default EmailSent;
