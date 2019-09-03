import React, { Component, Fragment } from 'react';
import LeftNav from '../components/LeftNav';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';
import modeAPI from '../controllers/ModeAPI';
import { KeyValueStore, Device, ErrorResponse, Home } from '../components/entities/API';
import { Context, context } from '../context/Context';
import { Progress } from 'antd';
import 'antd/dist/antd.css';
import ClientStorage from '../controllers/ClientStorage';
import { evaluateSensorTypes } from '../utils/SensorTypes';
import { Constants } from '../utils/Constants';
import { SensorModuleInterface, AddSensorModuleState } from '../components/entities/SensorModule';
import { RouteParams } from '../components/entities/Routes';
import SensorModuleComp from '../components/SensorModuleComp';
// required images imported
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const checkMark = require('../common_images/notifications/check-1.svg');
const addModule1 = require('../common_images/add-module-1.svg');
const addModule2 = require('../common_images/add-module-2.svg');
// declared props interface
interface AddSensorModuleProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}
export class AddSensorModule extends Component<
  AddSensorModuleProps & RouteComponentProps<RouteParams>,
  AddSensorModuleState
> {

  private componentUnmounted: boolean = false;

  constructor(props: AddSensorModuleProps & RouteComponentProps<RouteParams>, sensorContext: Context) {

    super(props, sensorContext);

    // If context does not have selectedGateway value, which is caused by the user reloading the add
    // sensor module page, we need to get the gatewayId from the router params
    if (!this.context.state.selectedGateway) {
      this.context.actions.setGateway(props.match.params.deviceId);
    }
    
    this.state = {
      // the modules available to pair with
      availableModules: [],
      // the modules already associated to a particular gateway
      associatedModules: [],
      // modules selected to link (post-discovery)
      selectedModules: [],
      // the gateway to link to
      selectedGateway: '',
      // metadata associated with the modules
      moduleMetadata: [],
      // gateway in scanning mode or not
      scanning: false,
      // scanning progress (0-100)
      scanningProgress: 0,
      // no sensor modules discovered
      noModules: false
    };
    // bind methods to component
    this.cancelScan = this.cancelScan.bind(this);
    this.startScan = this.startScan.bind(this);
    this.addNewModules = this.addNewModules.bind(this);
    // restore login, open websocket connection, and add event listener
    AppContext.restoreLogin();
    ModeConnection.openConnection();
    this.notify.bind(this);
    ModeConnection.addObserver(this);
  }
  // method for handling device events
  notify(event: any): void {
    const moduleData = event;
    // if in scanning mode and websocket receives a discovered module event:
    if (
      this.state.scanning &&
      moduleData &&
      moduleData.eventType === Constants.EVENT_DISCOVERED_SENSOR_MODULES &&
      moduleData.eventData.sensorModules &&
      this.state.availableModules
    ) {
      let newAvailableModules: any = [];
      // compare sensor modules discovered to pre-linked modules to determine available ones
      moduleData.eventData.sensorModules.forEach((sensorModule: any) => {
        if (
          !this.state.associatedModules.includes(sensorModule.sensorModuleId)
        ) {
          newAvailableModules.push(sensorModule);
        }
      });
      // update the state accordingly
      this.setState(() => {
        return {
          availableModules:
            this.state.availableModules.length >= newAvailableModules.length
              ? this.state.availableModules
              : newAvailableModules,
          moduleMetadata: moduleData
        };
      });
    }
  }
  // remove the event listener on unmount
  componentWillUnmount() {
    this.componentUnmounted = true;
    ModeConnection.removeObserver(this);
  }
  // method invoked if the user cancels the scan
  cancelScan(event: React.MouseEvent<HTMLButtonElement>): void {
    this.props.history.push('/devices');
  }
  // method for starting the scan
  async startScan(): Promise<void> {
    this.setState(() => {
      return {
        scanning: true
      };
    });
    // declare an array for populating pre-linked IDs
    const associatedModulesIds: string[] = [];
    try {
      // For each device, get all the modules associated with the device and combine them into an array of
      // associatedModulesIds so that we can filter out these modules.
      const associatedModules: KeyValueStore[] =
        (await Promise.all(this.context.state.devices.map((device: Device): Promise<KeyValueStore[]> => {
          // get the associated modules for the specified device
          return modeAPI.getAllDeviceKeyValueStoreByPrefix(device.id, Constants.SENSOR_MODULE_KEY_PREFIX);
        }))).flat();
      
      // get the modules' IDs and then insert them to the associatedModulesIds array
      associatedModulesIds.push(...associatedModules.map((module: SensorModuleInterface): string => {
        return module.value.id;
      }));
    } catch (error) {
      console.log(error);
    }

    this.setState(() => {
      return {
        associatedModules: associatedModulesIds
      };
    });

    // once we have all the list of assiociated modules, send a command to the selected device to search for modules
    ModeConnection.searchForSensorModules(this.context.state.selectedGateway);

    let requestCount: number = 0;
    const interval: number = window.setInterval(
      () => {
        if (this.componentUnmounted) {
          window.clearInterval(interval);
          return;
        }

        requestCount++;
        this.setState(() => {
          return {
            scanningProgress: requestCount * 10
          };
        });
        if (requestCount > 9) {
          window.clearInterval(interval);
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

  // method invoked once the user selects sensor modules and clicks "Add Sensor Modules"
  async addNewModules() {
    // restore user credentials and get home / associated devices
    await AppContext.restoreLogin();
    const home: Home = await modeAPI.getHome(ClientStorage.getItem('user-login').user.id);
    
    try {
      await Promise.all(this.state.selectedModules.map((selectedModule, index): Promise<any>[] => {
        const key: string = `${Constants.SENSOR_MODULE_KEY_PREFIX}${selectedModule.sensorModuleId}`;
        const params: KeyValueStore = {
          key: key,
          value: {
            id: selectedModule.sensorModuleId,
            gatewayID: this.context.state.selectedGateway,
            sensing: 'on',
            interval: 30,
            modelId: selectedModule.modelId,
            sensors: selectedModule.moduleSchema
          }
        };

        return [
          // associate new sensors to the home
          // Add key/value store for the home. NOTE: This might not be neccessary.
          modeAPI.setHomeKeyValueStore(home.id, key, params),

          // associate new sensors to the device
          // add key/value store for the device
          modeAPI.setDeviceKeyValueStore(this.context.state.selectedGateway, key, params),
        ];
      }).flat());

      this.props.history.push('/devices');

    } catch (error) {
      console.log('error posting to the kv store', error);
    }
  }

  // method invoked when a user selects or deselects a sensor module to pair with
  toggleModuleSelect(specificID: string) {
    let updatedModuleSet = this.state.selectedModules;
    const selectedModule = this.state.availableModules.filter(sModule => {
      return sModule.modelSpecificId === specificID;
    });
    // if this selected module already exists in state, remove it
    if (this.state.selectedModules.includes(selectedModule[0])) {
      updatedModuleSet = this.state.selectedModules.filter(sModule => {
        return sModule.modelSpecificId !== specificID;
      });
    } else {
      // otherwise add it
      updatedModuleSet.push(...selectedModule);
    }
    // update state accordingly
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
          <div className="page-header">Add Sensor Modules</div>
          <div className="scan-section">
            {!this.state.scanning &&
              !this.state.noModules &&
              this.state.availableModules.length === 0 && (
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
                          Place the sensor modules you want to connect to
                          within 5 feet of the gateway.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            {this.state.scanning && (
              <>
                <div className="scan-header">
                  Scanning for available sensor modules...
                </div>
                <div className="add-sensor-progress-bar">
                  <Progress
                    percent={this.state.scanningProgress}
                    showInfo={true}
                    strokeColor={'#7FCBCF'}
                    strokeWidth={20}
                  />
                </div>
              </>
            )}
            {!this.state.scanning &&
              this.state.availableModules.length !== 0 && (
                <>
                  <div className="scan-header">
                    Sensor modules discovered. Select modules to add to
                    your device.
                  </div>
                  <div className="available-sensors-section row">
                    {this.state.availableModules.map((sModule, index) => {
                      return (
                        <div className="sensor-module-wrapper col-12" key={index}>
                          <SensorModuleComp
                            model={sModule.modelSpecificId}
                            sensors={sModule.moduleSchema}
                            isSelected={this.state.selectedModules.includes(sModule)}
                            onClick={
                              (event: React.MouseEvent<HTMLElement>): void => {
                                this.toggleModuleSelect(sModule.modelSpecificId);
                              }
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            {!this.state.scanning && this.state.noModules && (
              <div className="scan-header">
                No modules discovered. Make sure your sensors are on and
                in range.
              </div>
            )}
            <div className="button-section">
              <button className="cancel-scan" onClick={this.cancelScan}>
                Cancel
              </button>
              {!this.state.scanning &&
              this.state.availableModules.length === 0 ? (
                <button
                  className="start-scan"
                  onClick={() => this.startScan()}
                >
                  Start Scanning
                </button>
              ) : (
                <button
                  className="add-sensor-module"
                  disabled={this.state.selectedModules.length === 0}
                  onClick={() => this.addNewModules()}
                >
                  Add Sensor Modules
                </button>
              )}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}
// This part is important to access context values
AddSensorModule.contextType = context;

export default withRouter(AddSensorModule);
