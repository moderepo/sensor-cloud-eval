import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';

interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    }
    
interface SensorModuleState {
}

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps, state: SensorModuleState) => {
    useEffect(
        () => {
            AppContext.restoreLogin();
            ModeConnection.openConnection();
    },  []);
    return (
        <div>
            <NavLink to="/hardware">Back to Hardware Overview</NavLink>
        </div>
    );
};

export default SensorModule;
