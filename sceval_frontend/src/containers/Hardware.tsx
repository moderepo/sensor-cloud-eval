import React, { Component, Fragment } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';
import { SensorModule } from '../containers/SensorModule';
import AlertDialogComponent from '../components/AlertDialogComponent';
import SensorModuleSet from '../components/entities/SensorModule';
import { Modal } from 'antd';
const { confirm } = Modal;
const sensorModule = require('../common_images/sensor_modules/alps-snm3.png');
const sensorTemp = require('../common_images/sensors/temp-active.svg');
const sensorHumidity = require('../common_images/sensors/humidity-active.svg');
const sensorLight = require('../common_images/sensors/uv-active.svg');
const sensorHeat = require('../common_images/sensors/heatstroke-active.svg');
const sensorNoise = require('../common_images/sensors/noise-active.svg');
const sensorVibration = require('../common_images/sensors/pressure-active.svg');
const deviceImage = require('../common_images/devices/gateway.svg');
const deviceLocation = require('../common_images/devices/location-pin.svg');

const MODE_API_BASE_URL = 'https://api.tinkermode.com/';
interface HardwareProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
}

interface HardwareState {
    devices: Array<any>;
    linkedModules: Array<SensorModuleSet>;
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
            linkedModules: [],
            selectedDevice: '',
            displayGatewayOptions: [],
            editingGateways: [],
            targetedModule: '',
            moduleInDeleteMode: ''
        };
        this.renderDeleteModal = this.renderDeleteModal.bind(this);
    }

    componentDidMount() {
        AppContext.restoreLogin(); // restore user credentials and get home / associated devices
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id).then((response: any) => {
            modeAPI.getDevices(response.id).then((deviceResponse: any) => {
                this.setState(() => {
                    return {
                        devices: deviceResponse
                    };
                });
            })
            .then(() => {
                this.state.devices.forEach((device, index) => {
                    const url = MODE_API_BASE_URL + 'devices/' + device.id + '/kv';
                    modeAPI.request('GET', url, {}).then((sensorModules: any) => {
                        const deviceBundle = {
                            device: device.id,
                            sensorModules: sensorModules.data.slice(1, sensorModules.data.length)
                        }; 
                        this.setState(() => {
                            return {
                                linkedModules: [...this.state.linkedModules, deviceBundle]
                            };
                        });
                    })
                    .catch((reason: any) =>  {
                        console.log('error posting to the kv store', reason);
                    });
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

    renderDeleteModal(event: any, moduleID: string, deviceID: string, deviceIndex: number): void {
        this.setState(() => {
            return {
                moduleInDeleteMode: moduleID
            };
        });
        confirm({
            title: `Are you sure you want to unlink #${moduleID}?`,
            content: 
            'Your existing data can still be accessed, but you will need to re-add your sensor module to \
             a gateway in order to receive new data.',
            onOk: () => this.handleOk(moduleID, deviceID, deviceIndex),
        });
    }

    handleOk(moduleID: string, deviceID: string, deviceIndex: number) {
        const url = MODE_API_BASE_URL + 'devices/' 
        + deviceID + '/kv/' + moduleID;
        modeAPI.request('DELETE', url, {}).then((response: any) => {
          if (response.status === 204) {
              const filteredModules = this.state.linkedModules[deviceIndex].sensorModules.filter((sensor) => {
                return sensor.key !== moduleID;
              });
              this.state.linkedModules[deviceIndex].sensorModules = filteredModules;
              this.setState(() => {
                return {
                    linkedModules: this.state.linkedModules
                };
              });
          }
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
                {/* {
                    this.state.moduleInDeleteMode &&
                    
                } */}
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
                                        { !this.state.editingGateways.includes(device.id) 
                                            && this.state.linkedModules.length > 0 ?
                                            this.state.linkedModules[index].sensorModules.map((sensor, key) => {
                                            return (
                                                <a 
                                                    key={key}
                                                    className="sensor-module"
                                                    onClick={event => 
                                                        this.goToSensorModule(event, sensor.key)}
                                                >
                                                    <img className="module-image" src={sensorModule} />
                                                    <div className="module-info">
                                                        <div className="sensor-module-name">{sensor.key}</div>
                                                        <div className="sensor-module-model">
                                                            {sensor.value.id}
                                                        </div>
                                                        {
                                                            sensor.value.sensors.map((sensorType, sensorIndex) => {  
                                                                // TODO: add logic for rendering sensor type images
                                                                return (
                                                                    <img 
                                                                        key={sensorIndex}
                                                                        className="sensor-type-image" 
                                                                        src={sensorTemp}
                                                                    />
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                </a>
                                            );
                                        }) :
                                        this.state.linkedModules.length > 0 &&
                                        this.state.linkedModules[index].sensorModules.map((sensor, key) => {
                                            return (
                                                <a 
                                                    key={key}
                                                    className="sensor-module"
                                                    onClick={event => 
                                                        this.renderDeleteModal(event, sensor.key, device.id, index)}
                                                >
                                                    <img className="module-image" src={sensorModule} />
                                                    <div className="module-info">
                                                        <div className="x-icon">x</div>
                                                        <div className="sensor-module-name">{sensor.key}</div>
                                                        <div className="sensor-module-model">
                                                            {sensor.value.id}
                                                        </div>
                                                        {
                                                            sensor.value.sensors.map((sensorType, sensorIndex) => {  
                                                                // TODO: add logic for rendering sensor type images
                                                                return (
                                                                    <img 
                                                                        key={sensorIndex}
                                                                        className="sensor-type-image" 
                                                                        src={sensorTemp}
                                                                    />
                                                                );
                                                            })
                                                        }
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
