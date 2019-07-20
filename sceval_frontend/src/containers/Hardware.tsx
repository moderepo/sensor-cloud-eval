import React, { Component } from 'react';
import { Redirect } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';

const sensorModule = require('../common_images/sensor_modules/alps-snm3.png');
const sensorTemp = require('../common_images/sensors/temp-active.svg');
const sensorHumidity = require('../common_images/sensors/humidity-active.svg');
const sensorLight = require('../common_images/sensors/uv-active.svg');
const sensorHeat = require('../common_images/sensors/heatstroke-active.svg');
const sensorNoise = require('../common_images/sensors/noise-active.svg');
const sensorVibration = require('../common_images/sensors/pressure-active.svg');
const deviceImage = require('../common_images/devices/gateway.svg');
const deviceLocation = require('../common_images/devices/location-pin.svg');
interface HardwareProps extends React.Props<any> {
isLoggedIn: boolean;
    onLogIn: () => void;
}

interface HardwareState {
    devices: Array<any>;
    selectedDevice: string;
}
export class Hardware extends Component<HardwareProps, HardwareState> {
    constructor(props: HardwareProps) {
        super(props);
        this.state = {
            devices: [],
            selectedDevice: ''
        };
    }

    componentDidMount() {
        AppContext.restoreLogin(); // restore user credentials and get home / associated devices
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id).then((response: any) => {
            modeAPI.getDevices(response.id).then((deviceResponse: any) => {
                this.setState(() => {
                    return {
                        devices: [{
                            id: 2002,
                            projectId: AppContext.getProjectId(),
                            name: 'MODE San Mateo'
                        },
                        {
                            id: 2001,
                            projectId: AppContext.getProjectId(),
                            name: 'TYO - Golang version'
                        },
                        {
                            id: 2002,
                            projectId: AppContext.getProjectId(),
                            name: 'Tokyo Office (Node ver. it\'s migrated to Gateway-34038)'
                        }]
                    };
                });
            });
        });
    }

    render() {
        if (!this.props.isLoggedIn) {
            return <Redirect to="/login" />;
        }
        return (
            <div>
                <LeftNav />
                <div className="hardware-section">
                    <div className="page-header">
                        { this.state.selectedDevice === '' ?
                            <h1>Hardware</h1> :
                            <h1>Add Sensor Modules</h1>
                        }
                    </div>
                <div className="gateways-section">
                    {
                        this.state.devices.map((device, index) => {
                            return (
                                <div 
                                    key={index}
                                    className="gateway-row"
                                >
                                    <div className="gateway-header">
                                        <div className="gateway-info">
                                            <img src={deviceImage} />
                                            <div className="gateway-id">{`Gateway-${device.id}`}</div>
                                            <div className="gateway-name">
                                                <img className="gateway-location" src={deviceLocation} />
                                            {device.name}
                                            </div>
                                        </div>
                                        <div className="gateway-settings">
                                            <button className="action-button">+ Add Sensor Modules</button>
                                            <button className="action-button settings">...</button>
                                        </div>
                                    </div>
                                    <div className="gateway-sensor-modules">
                                        <div className="sensor-module">
                                            <img className="module-image" src={sensorModule} />
                                            <div className="module-info">
                                                <div className="sensor-module-name">#0107:cc63f00b4ce4</div>
                                                <div className="sensor-module-model">
                                                    Model:OMRON Environment Sensor BL01
                                                </div>
                                                <img className="sensor-type-image" src={sensorTemp} />
                                                <img className="sensor-type-image" src={sensorHeat} />
                                                <img className="sensor-type-image" src={sensorHumidity} />
                                                <img className="sensor-type-image" src={sensorLight} />
                                                <img className="sensor-type-image" src={sensorNoise} />
                                                <img className="sensor-type-image" src={sensorVibration} />
                                            </div>
                                        </div>
                                        <div className="sensor-module">
                                            <img className="module-image" src={sensorModule} />
                                            <div className="module-info">
                                                <div className="sensor-module-name">#0107:cc63f00b4ce4</div>
                                                <div className="sensor-module-model">
                                                    Model:OMRON Environment Sensor BL01
                                                </div>
                                                <img className="sensor-type-image" src={sensorTemp} />
                                                <img className="sensor-type-image" src={sensorHeat} />
                                                <img className="sensor-type-image" src={sensorHumidity} />
                                                <img className="sensor-type-image" src={sensorLight} />
                                                <img className="sensor-type-image" src={sensorNoise} />
                                                <img className="sensor-type-image" src={sensorVibration} />
                                            </div>
                                        </div>
                                        <div className="sensor-module">
                                            <img className="module-image" src={sensorModule} />
                                            <div className="module-info">
                                                <div className="sensor-module-name">#0107:cc63f00b4ce4</div>
                                                <div className="sensor-module-model">
                                                    Model:OMRON Environment Sensor BL01
                                                </div>
                                                <img className="sensor-type-image" src={sensorTemp} />
                                                <img className="sensor-type-image" src={sensorHeat} />
                                                <img className="sensor-type-image" src={sensorHumidity} />
                                                <img className="sensor-type-image" src={sensorLight} />
                                                <img className="sensor-type-image" src={sensorNoise} />
                                                <img className="sensor-type-image" src={sensorVibration} />
                                            </div>
                                        </div>
                                        <div className="sensor-module">
                                            <img className="module-image" src={sensorModule} />
                                            <div className="module-info">
                                                <div className="sensor-module-name">#0107:cc63f00b4ce4</div>
                                                <div className="sensor-module-model">
                                                    Model:OMRON Environment Sensor BL01
                                                </div>
                                                <img className="sensor-type-image" src={sensorTemp} />
                                                <img className="sensor-type-image" src={sensorHeat} />
                                                <img className="sensor-type-image" src={sensorHumidity} />
                                                <img className="sensor-type-image" src={sensorLight} />
                                                <img className="sensor-type-image" src={sensorNoise} />
                                                <img className="sensor-type-image" src={sensorVibration} />
                                            </div>
                                        </div>
                                        <div className="sensor-module">
                                            <img className="module-image" src={sensorModule} />
                                            <div className="module-info">
                                                <div className="sensor-module-name">#0107:cc63f00b4ce4</div>
                                                <div className="sensor-module-model">
                                                    Model:OMRON Environment Sensor BL01
                                                </div>
                                                <img className="sensor-type-image" src={sensorTemp} />
                                                <img className="sensor-type-image" src={sensorHeat} />
                                                <img className="sensor-type-image" src={sensorHumidity} />
                                                <img className="sensor-type-image" src={sensorLight} />
                                                <img className="sensor-type-image" src={sensorNoise} />
                                                <img className="sensor-type-image" src={sensorVibration} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                    </div>
                </div>
            </div>
        );
    }
}

export default Hardware;
