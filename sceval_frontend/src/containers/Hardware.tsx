import React, { Component } from 'react';
import { Redirect } from 'react-router';

interface HardwareProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

interface HardwareState {

}
export class Hardware extends Component<HardwareProps, HardwareState> {
    render() {
        if (!this.props.isLoggedIn) {
            return <Redirect to="/login" />;
        }
        return (
            <div>
                Hardware
            </div>
        );
    }
}

export default Hardware;
