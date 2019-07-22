import React, { Component } from 'react';

interface AddSensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
    }
    
interface AddSensorModuleState {

}
export class AddSensorModule extends Component<AddSensorModuleProps, AddSensorModuleState> {
    constructor(props: AddSensorModuleProps) {
        super(props);
        this.state = {

        };
    }
    render() {
        return (
            <div>
                Add Sensor Module
            </div>
        );
    }
}

export default AddSensorModule;
