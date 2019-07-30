import React, { Component, Fragment } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';
import { SensorModule } from '../containers/SensorModule';
import AlertDialogComponent from '../components/AlertDialogComponent';
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
    displayGatewayOptions: Array<string>;
    editingGateways: Array<string>;
    targetedModule: string;
    moduleInDeleteMode: string;
}
export class Hardware extends Component<HardwareProps & RouteComponentProps<any>, HardwareState> {
    constructor(props: HardwareProps & RouteComponentProps<any>) {
        super(props);
        this.state = {
            devices: [],
            selectedDevice: '',
            displayGatewayOptions: [],
            editingGateways: [],
            targetedModule: '',
            moduleInDeleteMode: ''
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

    goToSensorModule(event: any, moduleID: string): void {
        this.setState(() => {
            return {
                selectedDevice: moduleID
            };
        });
        this.props.history.push('/sensor_modules/' + moduleID);
    }

    renderDeleteModal(event: any, moduleID: string): void {
        this.setState(() => {
            return {
                moduleInDeleteMode: moduleID
            };
        });
    }

    addSensorModules(event: any, gatewayID: string): void {
        this.props.history.push('/devices/' + gatewayID + '/add_sensor_modules');
    }

    showGatewayOptions(gatewayID: string): void {
        let selectedOptions: Array<string> = [...this.state.displayGatewayOptions, gatewayID];
        if (this.state.displayGatewayOptions.includes(gatewayID)) {
            selectedOptions = this.state.displayGatewayOptions.filter(gateway => {
                return gateway !== gatewayID;
            });
        }
        this.setState({
            displayGatewayOptions: selectedOptions
        });
    }

    toggleEditGateway(gatewayID: string): void {
        let gatewaySet: Array<string> = [...this.state.editingGateways, gatewayID];
        if (this.state.editingGateways.includes(gatewayID)) {
            gatewaySet = this.state.editingGateways.filter(gateway => {
                return gateway !== gatewayID;
            });
        } else {
            this.showGatewayOptions(gatewayID);
        }
        this.setState({
            editingGateways: gatewaySet
        });
    }

    render() {
        if (!this.props.isLoggedIn) {
            return <Redirect to="/login" />;
        }
        return (
            <div>
                <LeftNav />
                {
                    this.state.moduleInDeleteMode &&
                    <AlertDialogComponent
                        isOpen={this.state.moduleInDeleteMode !== ''}
                        titleText={`Are you sure you want to unlink ${this.state.moduleInDeleteMode}`}
                        contentText="Your existing data can still be accessed, but you will need to 
                        re-add your sensor module to a gateway in order to receive new data."
                        closeDialog={() => console.log('Closing')}
                        onOkayClick={() => console.log('Deleting...')}
                    />
                }
                { this.props.history.location.pathname === '/devices' ?
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
                                    className={this.state.editingGateways.includes(device.id) ?
                                        'gateway-row editing-gateway' : 'gateway-row'}
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
                                        <Fragment>
                                            { !this.state.editingGateways.includes(device.id) ?
                                            <>
                                                <button 
                                                    className="action-button"
                                                    onClick={event => this.addSensorModules(event, device.id)}
                                                >+ Add Sensor Modules
                                                </button>
                                                <button 
                                                    className="action-button settings"
                                                    onClick={() => this.showGatewayOptions(device.id)}
                                                >...
                                                </button>
                                            </> :
                                            <>
                                                <button 
                                                    className="done-button"
                                                    onClick={() => this.toggleEditGateway(device.id)}
                                                >Done
                                                </button>
                                            </>
                                            }
                                            </Fragment>
                                            {
                                                this.state.displayGatewayOptions.includes(device.id) &&
                                                <ul className="dropdown-menu">
                                                    <a
                                                        href="#"
                                                        onClick={() => this.toggleEditGateway(device.id)}
                                                    >Unlink Sensor Modules
                                                    </a>
                                                </ul>
                                            }
                                        </div>
                                    </div>
                                    <div 
                                        className={this.state.editingGateways.includes(device.id) ?
                                        'gateway-sensor-modules editing-module' : 'gateway-sensor-modules'}
                                    >
                                        { !this.state.editingGateways.includes(device.id) ?
                                            [1, 2, 3, 4, 5, 6].map((value, key) => {
                                            return (
                                                <a 
                                                    key={key}
                                                    className="sensor-module"
                                                    onClick={event => 
                                                        this.goToSensorModule(event, '#0107:cc63f00b4ce4')}
                                                >
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
                                                </a>
                                            );
                                        }) :
                                        [1, 2, 3, 4, 5, 6].map((value, key) => {
                                            return (
                                                <a 
                                                    key={key}
                                                    className="sensor-module"
                                                    onClick={event => 
                                                        this.renderDeleteModal(event, '#0107:cc63f00b4ce4')}
                                                >
                                                    <img className="module-image" src={sensorModule} />
                                                    <div className="module-info">
                                                        <div className="x-icon">x</div>
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
                                                </a>
                                            );
                                        })
                                        }                     
                                    </div>
                                </div>
                            );
                        })
                    }
                    </div>
                </div> :
                <Fragment>
                    <LeftNav />
                    <SensorModule
                        isLoggedIn={true}
                    />
                </Fragment>
                }
            </div>
        );
    }
}

export default withRouter(Hardware);
