import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import modeAPI from '../controllers/ModeAPI';
import * as Constants from '../utils/Constants';
import { KeyValueStore, Device, Home, ErrorResponse } from '../components/entities/API';
import {
  SensorModuleSet
} from '../components/entities/SensorModule';
import { evaluateSensorModelName, parseSensorModuleUUID } from '../utils/SensorTypes';
import { Modal, Menu, Dropdown } from 'antd';
import { Context, context } from '../context/Context';
import SensorModuleComp from '../components/SensorModuleComp';
import { NavLink } from 'react-router-dom';
import { useCheckUserLogin, useLoadUserHome, useIsLoading } from '../utils/CustomHooks';

// use the confirm modal from AntD
const { confirm } = Modal;
// required images imported
const loader = require('../common_images/notifications/loading_ring.svg');
const deviceImage = require('../common_images/devices/gateway.svg');
const deviceLocation = require('../common_images/devices/location-pin.svg');
const plus = require('../common_images/buttons/plus.svg');

interface HardwareProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}

/**
 * custom Hook for loading user's home devices. This hook is not really reuseable so we will keep it in here.
 * If we ever need to do something like this in another component, we can move it into the CustomHooks.ts
 * and export it.
 * @param home 
 */
interface LoadDevicesState {
  devices: Device[] | undefined;
  isLoading: boolean;
}
const useLoadHomeDevices = (home: Home | undefined): LoadDevicesState => {
  const [state, setState] = useState<LoadDevicesState>({
    devices: undefined, isLoading: true
  });
  
  useEffect (() => {
    if (home) {
      setState({...state, isLoading: true});
      modeAPI.getDevices(home.id).then((devices: Device[]): void => {
        setState({...state, devices: devices, isLoading: false});
      }).catch((error: ErrorResponse) => {
        // Unable to get devices
        setState({...state, isLoading: false});
      });
    }
  }, [home]);

  // Return the devices state AND also the isLoading state so that the user of this hook can do something
  // when we are loading devices
  return state;
}

/**
 * Custom hooks for loading sensor modules for a list of devices. This hook is defined here because
 * it is not really reuseable
 * @param devices 
 */
interface LoadModulesState {
  modules: SensorModuleSet[];
  isLoading: boolean;
}
const useLoadDevicesModules = (devices: Device[] | undefined): [SensorModuleSet[], Function, boolean] => {

  const [state, setState] = useState<LoadModulesState>({
    modules: [],
    isLoading: true
  });

  useEffect(() => {
    const loadModules = async (): Promise<void> => {
      setState({...state, isLoading: true});

      // declare linkedModules array of type SensorModuleSet
      const newLinkedModules: SensorModuleSet[] = [];
      // if associated devices exist
      if (devices && devices.length > 0) {
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

      setState({...state, modules: newLinkedModules, isLoading: false});
    };
    loadModules();
  }, [devices]);

  const setModules = (modules: SensorModuleSet[]):void => {
    setState({...state, modules: modules});
  }

  // Return the current set of modules AND also expose the setModules API so that the user of this hook can call
  // setModules to update the modules. And also return the loading state so that the user of this hook can do
  // something when the hook is loading module
  return [state.modules, setModules, state.isLoading];
};

const Hardware = withRouter((props: HardwareProps & RouteComponentProps) => {
  console.log('Render Hardware');
  const loginInfoState = useCheckUserLogin();
  const loadHomeState = useLoadUserHome(loginInfoState.loginInfo);
  const loadDevicesState = useLoadHomeDevices(loadHomeState.home);
  const [linkedModules, setLinkedModules, isLoadingModules] = useLoadDevicesModules(loadDevicesState.devices);
  const [selectedDevice, setSelectedDevice] = useState<number>(0);
  const [displayGatewayOptions, setDisplayGatewayOptions] = useState<
    Array<number>
  >([]);
  const [deletionMode, setDeletionMode] = useState<boolean>(false);
  const [deviceDeleteError, setDeviceDeleteError] = useState<boolean>(false);
  const [editingGateways, setEditingGateways] = useState<Array<number>>([]);
  const sensorContext: Context = useContext(context);
  const isLoadingData = useIsLoading(loginInfoState.isLoading, loadHomeState.isLoading, loadDevicesState.isLoading, isLoadingModules);

  // if the user isn't logged in, protect the route and redirect to /login
  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }


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
        setLinkedModules(updatedLinkedModules);
      }
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
  };

  // render delete gateway modal handler function for clicking on the 'Delete Gateway' setting for a gateway
  const renderDeleteDeviceModal = (
    deviceId: number,
  ): void => {
    confirm({
      title: `Are you sure you want to delete gateway #${deviceId}?`,
      content: `Please note that your device must be configured to allow On-Demand Gateway Provisioning
        in order to sucessfully remove the device from your home.`,
      onOk: async () => {
        setDeletionMode(true);
        const status = await modeAPI.deleteDevice(deviceId);
        if (status === 204) {
          const updatedLinkedModules = linkedModules.filter((sensorModule: any): boolean => {
            return sensorModule.device.id !== deviceId;
          });
          setLinkedModules(updatedLinkedModules);
          setDeviceDeleteError(false);
        } else {
          setDeviceDeleteError(true);
        }
        // show message for 3 seconds
        setTimeout(
          () => {
            setDeletionMode(false);
          },
          3000
        );
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
        `Your existing data can still be accessed, but you will need to re-add your sensor module to
             a gateway in order to receive new data.`,
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
    setDisplayGatewayOptions(selectedOptions);
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
            {!isLoadingData ? (
              <div className="sensor-module-wrapper col-12">
                <SensorModuleComp
                  name={sensor.value.name}
                  id={sensor.value.id}
                  modelId={`${parseSensorModuleUUID(sensor.value.id).modelId}`}
                  model={`${evaluateSensorModelName(parseSensorModuleUUID(sensor.value.id).modelId)}`}
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
              <img src={loader} alt="loader-spinner" />
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
          <div
            className="menu-setting-item" 
            onClick={() => toggleEditGateway(deviceId)}
          >
            Unlink Sensor Modules
          </div>
        </Menu.Item>
        <Menu.Item>
          <div
            className="menu-setting-item" 
            onClick={() => {
              renderDeleteDeviceModal(deviceId);
              setDeviceDeleteError(false);
            }}
          >
            Delete Gateway
          </div>
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlay={menu} trigger={['hover']}>
        <span
          onClick={() => showGatewayOptions(deviceId)}
          className="ant-dropdown-link"
        >...
        </span>
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
          <img src={deviceImage} alt="device icon" />
          <div className="gateway-id">{`Gateway-${deviceId}`}</div>
          <div className="gateway-name">
            <img className="gateway-location" src={deviceLocation} alt="gateway icon" />
            {device.name}
          </div>
        </div>
        <div className="gateway-settings">
          <Fragment>
            {!isEditingDevice ? (
              // if this gateway is not being edited, show normal setting
              <>
                <button
                  className="action-button"
                  onClick={event => addSensorModules(event, deviceId)}
                >
                  <img src={plus} className="plus" alt="add icon" />
                  Add Modules
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
          {!isLoadingData ? (
            renderDevice(linkedModule.device, index)
          ) : (
            <img src={loader} alt="loader-spinner"/>
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
      <div className="hardware-section">
        <div className="page-header">
          {selectedDevice === 0 ? (
            <h1 className="hardware-header">
            Hardware
            <NavLink
              className="add-gateway-button"
              to="/add_gateway"
            >
            <img src={plus} className="plus" alt="add icon" />
            Add Gateway
            </NavLink>
            </h1>
          ) : (
            <h1 className="header">Add Sensor Modules</h1>
          )}
        </div>
        {
          deletionMode &&
          <div className={deviceDeleteError ? 'warning-animation fade-out' : 'save-animation fade-out'}>
            {deviceDeleteError ? 'Failed to delete device.' : 'Successfully deleted device.'}
          </div>
        }
        <div className="gateways-section">
          {linkedModules !== undefined && linkedModules.length > 0 ? (
            renderDevices()
          ) : // If linkedModules is empty AND we are not loading data, this mean the home
          // does not have any device
          !isLoadingData ? (
            <div className="gateway-row no-device">
              You don't have any device. Please use the
              <a href="https://console.tinkermode.com" target="blank">
                {' '}
                Mode Console{' '}
              </a>
              to create and add devices to your home.
            </div>
          ) : (
            <img src={loader} alt="loader-spinner"/>
          )}
        </div>
      </div>
    </div>
  );
});

export default Hardware;
