import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';

interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    }
    
interface SensorModuleState {
}

export class SensorModule extends Component<SensorModuleProps, SensorModuleState> {
    constructor(props: SensorModuleProps) {
        super(props);
        this.state = {

        };
    }

    componentDidMount() {
        AppContext.restoreLogin();
        ModeConnection.openConnection();

    }
    render() {
        return (
            <div>
                <NavLink to="/hardware">Back to Hardware Overview</NavLink>
            </div>
        );
    }
}

export default SensorModule;
