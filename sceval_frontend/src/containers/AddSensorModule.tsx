import React, { Component, Fragment } from 'react';
import LeftNav from '../components/LeftNav';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import { Progress } from 'antd';
import 'antd/dist/antd.css';

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

interface AddSensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
    onLogIn: () => void;
    }
    
interface AddSensorModuleState {
    availableModules: Array<any>;
    moduleMetadata: Array<any>;
    selectedModules: Array<any>;
    scanning: boolean;
    scanningProgress: number;
    noModules: boolean;
}

export class AddSensorModule extends Component<AddSensorModuleProps & RouteComponentProps<any>, AddSensorModuleState> {
    constructor(props: AddSensorModuleProps & RouteComponentProps) {
        super(props);
        this.state = {
            availableModules: [],
            selectedModules: [],
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

    startScan(): void {
        AppContext.restoreLogin();
        const ws = ModeConnection.openConnection();
        this.setState(() => {
            return {
                scanning: true
            };
        });
        if (ws !== undefined) {
            ws.onmessage = event => {
                const moduleData = JSON.parse(event.data);
                if (moduleData && moduleData.eventData.sensorModules.length > this.state.availableModules.length) {
                    this.setState(() => {
                        return {
                            availableModules: moduleData.eventData.sensorModules,
                            moduleMetadata: moduleData
                        };
                    });
                    if (!event.data) {
                        this.setState(() => {
                            return {
                                noModules: true
                            };
                        });
                    }
                }
            };
        }
        const UID = AppContext.getLoginInfo();
        if (UID !== null) {
            let gateway = '';
            modeAPI.getHome(UID.user.id).then((response: any) => {
                modeAPI.getDevices(response.id).then((deviceResponse: any) => {
                    gateway = deviceResponse[0].id;
                });
                let requestCount = 0;
                let interval = setInterval(
                    () => {
                        requestCount++;
                        this.setState(() => {
                            return {
                                scanningProgress: requestCount * 10
                            };
                        });
                        ModeConnection.searchForSensorModules(gateway);
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
            });
        }
    }

    addNewModules() {
        this.state.selectedModules.forEach((selectedModule, index) => {
            console.log(selectedModule);
            // do a KV patch here
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
            <Fragment>
            <LeftNav />
                <div className="scan-container">
                    <div className="page-header">
                        Add Sensor Modules
                    </div>
                    <div className="scan-section">
                        { !this.state.scanning && !this.state.noModules && this.state.availableModules.length === 0 &&
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
                                        Place the sensor modules you want to connect to within 5 feet of the gateway.
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
                                onClick={this.startScan}
                            >Start Scanning
                            </button> :
                            <button 
                                className="add-sensor-module"
                                disabled={this.state.selectedModules.length === 0}
                                onClick={this.addNewModules}
                            >Add Sensor Modules
                            </button>
                            }
                        </div>
                    </div>
                </div>
            </Fragment>
        );
    }
}
export default withRouter(AddSensorModule);