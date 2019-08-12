
import React, { Component, Fragment } from 'react';
import LeftNav from '../components/LeftNav';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import { Context, ContextConsumer } from '../context/Context';
import { Progress } from 'antd';
import 'antd/dist/antd.css';
import ClientStorage from '../controllers/ClientStorage';

const enySensor = require('../common_images/sensors/eny-sensor.png');
const sensorTemp = require('../common_images/sensors/temp-active.svg');
const checkMark = require('../common_images/notifications/check-1.svg');
const sensorHumidity = require('../common_images/sensors/humidity-active.svg');
const sensorLight = require('../common_images/sensors/uv-active.svg');
const sensorHeat = require('../common_images/sensors/heatstroke-active.svg');
const sensorNoise = require('../common_images/sensors/noise-active.svg');
const sensorVibration = require('../common_images/sensors/pressure-active.svg');
const addModule1 = require('../common_images/add-module-1.svg');
const addModule2 = require('../common_images/add-module-2.svg');
const MODE_API_BASE_URL = 'https://api.tinkermode.com/';
interface AddSensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
    }
    
interface AddSensorModuleState {
    availableModules: Array<any>;
    associatedModules: Array<any>;
    moduleMetadata: Array<any>;
    selectedModules: Array<any>;
    selectedGateway: string;
    scanning: boolean;
    scanningProgress: number;
    noModules: boolean;
}
// TODO: Change into React.FC without breaking available sensors discovery (commented code below)
export class AddSensorModule extends Component<AddSensorModuleProps & RouteComponentProps<any>, AddSensorModuleState> {
    constructor(props: AddSensorModuleProps & RouteComponentProps) {
        super(props);
        this.state = {
            availableModules: [],
            associatedModules: [],
            selectedModules: [],
            selectedGateway: '',
            moduleMetadata: [],
            scanning: false,
            scanningProgress: 0,
            noModules: false,
        };
        this.cancelScan = this.cancelScan.bind(this);
        this.startScan = this.startScan.bind(this);
        this.addNewModules = this.addNewModules.bind(this);
    }

    cancelScan(event: React.MouseEvent<HTMLButtonElement>): void {
        this.props.history.push('/devices');
    }

    startScan(context: Context): void {
        AppContext.restoreLogin();
        this.setState(() => {
            return {
                scanning: true
            };
        });
        if (context.state.webSocket !== undefined) {
            context.state.webSocket.onmessage = event => {
                const moduleData = JSON.parse(event.data);
                if (moduleData && moduleData.eventData.sensorModules && this.state.scanning) {
                    let newAvailableModules: any = [];
                    moduleData.eventData.sensorModules.forEach((sensorModule: any) => {
                        if (!this.state.associatedModules.includes(sensorModule.sensorModuleId)) {
                            newAvailableModules.push(sensorModule);
                        }
                    });
                    this.setState(() => {
                        return {
                            availableModules: this.state.availableModules.length 
                            >= newAvailableModules.length ? this.state.availableModules : newAvailableModules,
                            moduleMetadata: moduleData
                        };
                    });
                    if (!event.data || this.state.availableModules.length === 0) {
                        this.setState(() => {
                            return {
                                noModules: true
                            };
                        });
                    }
                }
            };
        }
        const url =
        MODE_API_BASE_URL + 'devices/' + context.state.selectedGateway + '/kv';
        modeAPI
        .request('GET', url, {})
        .then((associatedResponse: any) => {
            const modules = associatedResponse.data.filter((sModule: any) => {
                return sModule.key !== 'firmwareVersion' && sModule.key !== 'firmwareDistribution';
              });
            const associatedModules: any = [];
            modules.forEach((sensor: any) => {
                associatedModules.push(sensor.value.id);
            });
            this.setState(() => {
                return {
                    associatedModules: associatedModules
                };
            });
        });
        let requestCount = 0;
        ModeConnection.searchForSensorModules(context.state.selectedGateway);
        let interval = setInterval(
            () => {
                requestCount++;
                this.setState(() => {
                    return {
                        scanningProgress: requestCount * 10
                    };
                });
                if (requestCount > 9) {
                    clearInterval(interval);
                    this.setState(() => {
                        return {
                            scanning: false
                        };
                    });
                }
            },
            1000
        );
}

    addNewModules(context: Context) {
        AppContext.restoreLogin(); // restore user credentials and get home / associated devices
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((homeResponse: any) => {
            this.state.selectedModules.forEach((selectedModule, index) => {
                const url =
                  MODE_API_BASE_URL +
                  'devices/' +
                   + context.state.selectedGateway +
                  '/kv/sensorModule' +
                  selectedModule.sensorModuleId;
                const params = {
                  value: {
                    id: selectedModule.sensorModuleId,
                    sensing: 'on',
                    interval: '30',
                    sensors: selectedModule.moduleSchema
                  }
                };
                ModeConnection.startSensor(homeResponse, selectedModule, context.state.selectedGateway);
                ModeConnection.listSensorModules(this.state.selectedGateway);
                modeAPI
                  .request('PUT', url, params)
                  .then((response: any) => {
                    this.props.history.push('/devices');
                  })
                  .catch((reason: any) => {
                    console.log('error posting to the kv store', reason);
                  });
                
              });
        });
    }
    
    toggleModuleSelect(specificID: string) {
        let updatedModuleSet = this.state.selectedModules;
        const selectedModule = this.state.availableModules.filter(sModule => {
            return sModule.modelSpecificId === specificID;
        }); 
        if (this.state.selectedModules.includes(selectedModule[0])) {
            updatedModuleSet = this.state.selectedModules.filter(sModule => {
                return sModule.modelSpecificId !== specificID;
            });
        } else {
            updatedModuleSet.push(...selectedModule);
        }
        this.setState(() => {
            return {
                selectedModules: updatedModuleSet
            };
        });
    }

    render() {
        return (
            <ContextConsumer>
            {(context: Context) =>
                context && (
                <Fragment>
                <LeftNav />
                    <div className="scan-container">
                        <div className="page-header">
                            Add Sensor Modules
                        </div>
                        <div className="scan-section">
                            { !this.state.scanning && !this.state.noModules && 
                              this.state.availableModules.length === 0 &&
                            <>
                                <div className="scan-header">
                                    Scan for available sensor modules
                                </div>
                                <div className="directions">
                                    <div className="step-1">
                                        <span className="circled-number">1</span>
                                        <div className="direction">
                                            <img src={addModule1} />
                                            <p>Turn on all sensor modules.</p>
                                        </div>
                                    </div>
                                    <div className="step-2">
                                        <span className="circled-number">2</span>
                                        <div className="direction">
                                            <img src={addModule2} />
                                            <p>
                                            Place the sensor modules you want to 
                                            connect to within 5 feet of the gateway.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                            }
                            { this.state.scanning &&
                            <>
                                <div className="scan-header">
                                    Scanning for available sensor modules...
                                </div>
                                <div className="progress-bar">
                                    <Progress 
                                        percent={this.state.scanningProgress}
                                        showInfo={true}
                                        strokeColor={'#7FCBCF'}
                                        strokeWidth={20}
                                    />
                                </div>
                            </>
                            }
                            { !this.state.scanning && this.state.availableModules.length !== 0 &&
                            <>
                                <div className="scan-header">
                                    Sensor modules discovered. Select modules to add to your device.
                                </div>
                                <div className="available-sensors-section">
                                {
                                    this.state.availableModules.map((sModule, index) => {
                                        return (
                                            <a 
                                                key={index}
                                                className={ !this.state.selectedModules.includes(sModule) ?
                                                    `sensor-module` : `sensor-module selected`
                                                }
                                                onClick={() => 
                                                this.toggleModuleSelect(sModule.modelSpecificId)}
                                            >
                                            <img className="module-image" src={enySensor} />
                                            { this.state.selectedModules.includes(sModule) &&
                                                <img className="checked-module" src={checkMark} />
                                            }
                                            <div className="module-info">
                                                <div className="sensor-module-model">
                                                    Model: {sModule.modelSpecificId}
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
                            </>
                            }
                            { !this.state.scanning && this.state.noModules &&
                            <div className="scan-header">
                                No modules discovered. Make sure your sensors are on and in range.
                            </div>
                            }
                            <div className="button-section">
                                <button 
                                    className="cancel-scan"
                                    onClick={this.cancelScan}
                                >Cancel
                                </button>
                                { !this.state.scanning && this.state.availableModules.length === 0 ?
                                <button 
                                    className="start-scan"
                                    onClick={() => this.startScan(context)}
                                >Start Scanning
                                </button> :
                                <button 
                                    className="add-sensor-module"
                                    disabled={this.state.selectedModules.length === 0}
                                    onClick={() => this.addNewModules(context)}
                                >Add Sensor Modules
                                </button>
                                }
                            </div>
                        </div>
                    </div>
                </Fragment>
                )
            }
            </ContextConsumer>
        );
    }
}
export default withRouter(AddSensorModule);