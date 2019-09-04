import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI, { ModeConstants, ModeAPI } from '../controllers/ModeAPI';
import { KeyValueStore, Device, Home } from '../components/entities/API';
import { LoginInfo } from '../components/entities/User';
import AppContext from '../controllers/AppContext';
import {
  SensorModuleSet,
  SensorModuleInterface
} from '../components/entities/SensorModule';
import { evaluateModel } from '../utils/SensorTypes';
import { Modal, Menu, Dropdown } from 'antd';
import { Context, context } from '../context/Context';
import ModeConnection from '../controllers/ModeConnection';
import { Constants } from '../utils/Constants';
import SensorModuleComp from '../components/SensorModuleComp';

// use the confirm modal from AntD
const { confirm } = Modal;
// required images imported
const loader = require('../common_images/notifications/loading_ring.svg');
const deviceImage = require('../common_images/devices/gateway.svg');
const deviceLocation = require('../common_images/devices/location-pin.svg');

interface HardwareProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}

const Hardware = withRouter((props: HardwareProps & RouteComponentProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [linkedModules, setlinkedModules] = useState<Array<SensorModuleSet>>(
    []
  );
  const [selectedDevice, setSelectedDevice] = useState<number>(0);
  const [displayGatewayOptions, setdisplayGatewayOptions] = useState<
    Array<number>
  >([]);
  const [deletionMode, setDeletionMode] = useState<boolean>(false);
  const [deviceDeleted, setDeviceDeleted] = useState<boolean>(false);
  const [deviceDeleteMessage, setDeviceDeleteMessage] = useState<string>('');
  const [editingGateways, setEditingGateways] = useState<Array<number>>([]);
  const sensorContext: Context = useContext(context);
  // if the user isn't logged in, protect the route and redirect to /login
  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }
  // initialize handler for opening the websocket and getting all devices and associated sensor modules
  const initialize = async (): Promise<void> => {
    setIsLoading(true);
    // open websocket connection
    ModeConnection.openConnection();
    // restore login
    const loginInfo: LoginInfo = await AppContext.restoreLogin();
    // get home associated with project
    const home: Home = await modeAPI.getHome(loginInfo.user.id);
    // get devices in home
    const devices: Device[] = await modeAPI.getDevices(home.id);
    // declare linkedModules array of type SensorModuleSet
    const newLinkedModules: SensorModuleSet[] = [];
    // if associated devices exist
    if (devices.length > 0) {
      // Load modules for each device. Because we need to wait until all the modules are loaded
      // before we can continue, we have to *await* AND we must use For loop, not .forEach because
      // await doesn't work in forEach
      for (let device of devices) {
        try {
          // sensor modules are stored as Key/Value store which the keys are started with sensorModule*
          const sensorModules: KeyValueStore[] = await modeAPI.getAllDeviceKeyValueStoreByPrefix(
            device.id,
            Constants.SENSOR_MODULE_KEY_PREFIX
          );

          newLinkedModules.push({
            device: device,
            sensorModules: sensorModules
          });
        } catch (error) {
          console.log('Error loading device modules', error.message);
        }
      }
    }
    // sort linked modules by ID and update state accordingly
    newLinkedModules.sort((a: SensorModuleSet, b: SensorModuleSet): number => {
      return a.device.id - b.device.id;
    });

    setlinkedModules(newLinkedModules);
    setIsLoading(false);
  };

  /**
   * This useEffect doesn't depend on any state so it will only be called once, when the
   * component is mounted.
   */
  useEffect(() => {
    initialize();
  },        []); // this argument outlines re-rendering dependencies

  /**
   * This useEffect depends on one or more states so it will be called each time one of the state change.
   */
  useEffect(() => {
    // Listen to _keyValueSaved_ event from the web socket and reload the sensor module
    // data for the module that triggered the event.
    const messageHandler: any = {
      notify: (message: any): void => {
        if (
          message.eventType === ModeConstants.EVENT_DEVICE_KEY_VALUE_SAVED &&
          message.eventData &&
          linkedModules !== undefined
        ) {
          // message.eventData will be the key/value store for the sensorModule
          const updatedSensorModule: SensorModuleInterface = message.eventData;

          // Find the linked module that has a sensor module with the same key and at the same time, find the deviceId
          // of the device the module is connected to because we need the deviceId to make an API call to load the
          // module data
          interface Findable {
            deviceId: number;
            sensorModule: SensorModuleInterface;
          }
          // First, build an array of Findable and then find the sensor module that has the same
          // key as the module that triggered the event
          const result = linkedModules
            .reduce(
              (
                prevValue: Findable[],
                currValue: SensorModuleSet
              ): Findable[] => {
                return [
                  ...prevValue,
                  ...currValue.sensorModules.map(
                    (module: SensorModuleInterface): Findable => {
                      return {
                        deviceId: currValue.device.id,
                        sensorModule: module
                      };
                    }
                  )
                ];
              },
              []
            )
            .find((findable: Findable): boolean => {
              return findable.sensorModule.key === updatedSensorModule.key;
            });

          if (result) {
            // Found the sensor module, now reload the KV for the module and update the module's value
            // update the module's data with data from response but this won't trigger a re-render
            Object.assign(result.sensorModule, updatedSensorModule);
            setlinkedModules([...linkedModules]); // copy the linkedModules and set it to trigger re-render
          }
        }
      }
    };
    // add websocket event listener
    ModeConnection.addObserver(messageHandler);

    // return a cleanup function to be called when the component is unmounted
    return (): void => {
      // remove websocket event listener
      ModeConnection.removeObserver(messageHandler);
    };
    // this argument outlines invoke dependencies
  },        [linkedModules]);

  // handler for redirecting the user to a particular sensor module view on sensor module click
  const goToSensorModule = (
    event: any,
    deviceId: number,
    moduleId: string
  ): void => {
    props.history.push(`/sensor_modules/${deviceId}/${moduleId}`);
  };
  // handler method for unlinking a sensor module from a gateway
  const handleOkUnlinkModule = async (
    moduleID: string,
    deviceId: number,
    deviceIndex: number
  ) => {
    // try to delete the device
    try {
      const status: number = await modeAPI.deleteDeviceKeyValueStore(
        deviceId,
        moduleID
      );
      // if the deletion is successful
      if (status === 204) {
        // update linked modules in the UI with all linked modules not including the recently deleted one
        const filteredModules = linkedModules[deviceIndex].sensorModules.filter(
          sensor => {
            return sensor.key !== moduleID;
          }
        );
        let updatedLinkedModules = [...linkedModules];
        updatedLinkedModules[deviceIndex].sensorModules = filteredModules;
        setlinkedModules(updatedLinkedModules);
      }
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
  };

  // render delete device modal handler function for clicking on the 'Delete Device' setting for a gateway
  const renderDeleteDeviceModal = (
    deviceId: number,
  ): void => {
    confirm({
      title: `Are you sure you want to delete device #${deviceId}?`,
      content:
        'Please note that your device must be configured to allow On-Demand Device Provisioning \
        in order to sucessfully remove the device from your home.',
      onOk: async () => {
        const status = await modeAPI.deleteDevice(deviceId);
        if (status === 204) {
          setDeviceDeleted(true);
          setDeviceDeleteMessage('Successfully deleted device.');
        } else {
          setDeviceDeleted(false);
          setDeviceDeleteMessage('Failed to delete device');
        }
        setDeletionMode(false);
      }
    });
  };

  // render delete modal handler function for clicking on a particular module while in delete-mode
  const renderDeleteModuleModal = (
    event: any,
    moduleID: string,
    deviceId: number,
    deviceIndex: number
  ): void => {
    confirm({
      title: `Are you sure you want to unlink #${moduleID}?`,
      content:
        'Your existing data can still be accessed, but you will need to re-add your sensor module to \
             a gateway in order to receive new data.',
      onOk: () => handleOkUnlinkModule(moduleID, deviceId, deviceIndex)
    });
  };
  // method invoked after clicking an "Add Sensor  Modules button for a particular gateway"
  const addSensorModules = (event: any, gatewayID: number): void => {
    // direct the user to the "add_sensor_modules" route
    props.history.push(`/devices/${gatewayID}/add_sensor_modules`);
    setSelectedDevice(gatewayID);
    // set the selected gateway
    sensorContext.actions.setGateway(gatewayID);
  };
  // method invoked after clicking on a the gateway settings button (...)
  const showGatewayOptions = (gatewayID: number): void => {
    // update display gateway options state value with this new gateway ID
    let selectedOptions: Array<number> = [...displayGatewayOptions, gatewayID];
    // if it already exists, then remove it for toggling
    if (displayGatewayOptions.includes(gatewayID)) {
      selectedOptions = displayGatewayOptions.filter(gateway => {
        return gateway !== gatewayID;
      });
    }
    // update state accordingly
    setdisplayGatewayOptions(selectedOptions);
  };
  // method invoked after clicking on a the gateway options button to put gateway in edit-mode
  const toggleEditGateway = (gatewayID: number): void => {
    // create a new array corresponding to the set of gateways in edit mode
    let gatewaySet: Array<number> = [...editingGateways, gatewayID];
    // if the gateway ID already exists, remove it and update state accordingly
    if (editingGateways.includes(gatewayID)) {
      gatewaySet = editingGateways.filter(gateway => {
        return gateway !== gatewayID;
      });
    } else {
      showGatewayOptions(gatewayID);
    }
    setEditingGateways(gatewaySet);
  };

  /**
   * Render ALL sensor modules for the specified device
   * @param deviceId
   * @param deviceIndex
   */
  const renderSensorModules = (
    deviceId: number,
    deviceIndex: number
  ): React.ReactNode => {
    const isEditingDevice: boolean = editingGateways.includes(deviceId);
    
    if (linkedModules && linkedModules[deviceIndex] && linkedModules[deviceIndex].sensorModules.length > 0) {
      const modules = linkedModules[deviceIndex].sensorModules.map((sensor, key) => {
        return (
          <Fragment key={key}>
            {!isLoading ? (
              <div className="sensor-module-wrapper col-12">
                <SensorModuleComp
                  name={sensor.value.name ? sensor.value.name : sensor.key.split('sensorModule')[1]}
                  model={`${evaluateModel(sensor.value.id.split(':')[0])}`}
                  sensors={sensor.value.sensors}
                  isEditing={isEditingDevice}
                  onClick={
                    (event: React.MouseEvent<HTMLElement>): void => {
                      if (isEditingDevice) {
                        renderDeleteModuleModal(event, sensor.key, deviceId, deviceIndex);
                      } else {
                        goToSensorModule(event, deviceId, sensor.value.id);
                      }
                    }
                  }
                />
              </div>
            ) : (
              <img src={loader} />
            )}
          </Fragment>
        );
      });
      return modules;
    } else {
      return (
        <div className="no-modules-section d-flex flex-column align-items-center justify-content-center">
          <div className="no-modules-header">No Sensor Modules</div>
          <div className="no-modules-action">
            Click the "Add Sensor Modules" button to set up new sensor modules.
          </div>
        </div>
      );
    }
  };

  const renderDropDownSetting = (deviceId: number): React.ReactNode => {
    const menu = (
      <Menu>
        <Menu.Item>
          <a
            className="menu-setting-item" 
            href="#" 
            onClick={() => toggleEditGateway(deviceId)}
          >
            Unlink Sensor Modules
          </a>
        </Menu.Item>
        <Menu.Item>
          <a 
            className="menu-setting-item" 
            href="#" 
            onClick={() => {
              renderDeleteDeviceModal(deviceId);
              setDeviceDeleteMessage('');
              setDeletionMode(true);
            }}
          >
            Delete Device
          </a>
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlay={menu} trigger={['hover']}>
        <a
          onClick={() => showGatewayOptions(deviceId)}
          className="ant-dropdown-link"
          href="#"
        >...
        </a>
      </Dropdown>
    );
  };

  /**
   * Render the device's header, the device icon, name, ID, and the option to add/remove modules
   */
  const renderDeviceHeader = (
    device: Device,
    deviceIndex: number
  ): React.ReactNode => {
    const deviceId: number = device.id;
    const isEditingDevice: boolean = editingGateways.includes(deviceId);

    return (
      <div className="gateway-header">
        <div className="gateway-info">
          <img src={deviceImage} />
          <div className="gateway-id">{`Gateway-${deviceId}`}</div>
          <div className="gateway-name">
            <img className="gateway-location" src={deviceLocation} />
            {device.name}
          </div>
        </div>
        {
          deviceDeleteMessage &&
          <div className="deletion-response">
            
          </div>
        }
        <div className="gateway-settings">
          <Fragment>
            {!isEditingDevice ? (
              // if this gateway is not being edited, show normal setting
              <>
                <button
                  className="action-button"
                  onClick={event => addSensorModules(event, deviceId)}
                >
                  + Add Sensor Modules
                </button>
                {renderDropDownSetting(deviceId)}
              </>
            ) : (
              // if it is being edited, show done button
              <>
                <button
                  className="done-button"
                  onClick={() => toggleEditGateway(deviceId)}
                >
                  Done
                </button>
              </>
            )}
          </Fragment>
        </div>
      </div>
    );
  };

  /**
   * Render all the modules for the specified device
   * @param device
   * @param deviceIndex
   */
  const renderModules = (
    device: Device,
    deviceIndex: number
  ): React.ReactNode => {
    const deviceId: number = device.id;
    const isEditingDevice: boolean = editingGateways.includes(deviceId);
    const sensorModules: SensorModuleInterface[] =
      linkedModules[deviceIndex].sensorModules;

    return (
      <div
        className={`gateway-sensor-modules row ${
          isEditingDevice ? ' editing-module' : ''
        }`}
      >
        {
          renderSensorModules(deviceId, deviceIndex)
        }
      </div>
    );
  };

  /**
   * Render 1 device
   * @param device
   * @param deviceIndex
   */
  const renderDevice = (
    device: Device,
    deviceIndex: number
  ): React.ReactNode => {
    const deviceId: number = device.id;
    const isEditingGateway: boolean = editingGateways.includes(deviceId);
    return (
      <div
        key={deviceId}
        className={`gateway-row ${isEditingGateway ? 'editing-gateway' : ''}`}
      >
        {renderDeviceHeader(device, deviceIndex)}
        {renderModules(device, deviceIndex)}
      </div>
    );
  };

  /**
   * Render ALL devices
   */
  const renderDevices = (): React.ReactNode => {
    return linkedModules.map((linkedModule: SensorModuleSet, index) => {
      // Render each device/gateway
      return (
        <Fragment key={index}>
          {!isLoading ? (
            renderDevice(linkedModule.device, index)
          ) : (
            <img src={loader} />
          )}
        </Fragment>
      );
    });
  };

  /**
   * Render Hardware page
   */
  return (
    <div>
      <LeftNav />
      <div className="hardware-section">
        <div className="page-header">
          {selectedDevice === 0 ? (
            <h1>Hardware</h1>
          ) : (
            <h1>Add Sensor Modules</h1>
          )}
        </div>
        <div className="gateways-section">
          {linkedModules !== undefined && linkedModules.length > 0 ? (
            renderDevices()
          ) : // If linkedModules is empty AND we are not loading data, this mean the home
          // does not have any device
          !isLoading ? (
            <div className="gateway-row no-device">
              You don't have any device. Please use the
              <a href="https://console.tinkermode.com" target="blank">
                {' '}
                Mode Console{' '}
              </a>
              to create and add devices to your home.
            </div>
          ) : (
            <img src={loader} />
          )}
        </div>
      </div>
    </div>
  );
});

export default Hardware;
