import React from 'react';
import { Redirect } from 'react-router';

interface HardwareProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

const Hardware: React.FC<HardwareProps> = (props: HardwareProps) => {
    if (!props.isLoggedIn) {
        return <Redirect to="/login" />;
    }
    return <div>Hardware</div>;
};
export default Hardware;
