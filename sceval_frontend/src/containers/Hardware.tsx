import React, { Fragment, useState, useEffect, useContext } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI, { ModeConstants } from '../controllers/ModeAPI';
import { KeyValueStore, Device, Home } from '../components/entities/API';
import { LoginInfo } from '../components/entities/User';
import AppContext from '../controllers/AppContext';
import {
  SensorModuleSet,
  SensorModuleInterface
} from '../components/entities/SensorModule';
import { evaluateSensorTypes } from '../utils/SensorTypes';
import { Modal } from 'antd';
import { Context, context } from '../context/Context';
import ModeConnection from '../controllers/ModeConnection';
import { Constants } from '../utils/Constants';

const { confirm } = Modal;

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
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
  const [editingGateways, setEditingGateways] = useState<Array<number>>([]);
  const sensorContext: Context = useContext(context);

  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }

  const initialize = async (): Promise<void> => {
    setIsLoading(true);
    ModeConnection.openConnection();
    const loginInfo: LoginInfo = await AppContext.restoreLogin();
    const home: Home = await modeAPI.getHome(loginInfo.user.id);
    const devices: Device[] = await modeAPI.getDevices(home.id);
    const newLinkedModules: SensorModuleSet[] = [];

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

    ModeConnection.addObserver(messageHandler);

    // return a cleanup function to be called when the component is unmounted
    return (): void => {
      ModeConnection.removeObserver(messageHandler);
    };
  },        [linkedModules]); // this argument outlines re-rendering dependencies

  const goToSensorModule = (event: any, moduleID: string): void => {
    props.history.push('/sensor_modules/' + moduleID);
  };

  const handleOkUnlinkModule = async (
    moduleID: string,
    deviceID: number,
    deviceIndex: number
  ) => {
    try {
      const status: number = await modeAPI.deleteDeviceKeyValueStore(
        deviceID,
        moduleID
      );
      if (status === 204) {
        const filteredModules = linkedModules[deviceIndex].sensorModules.filter(
          sensor => {
            return sensor.key !== moduleID;
          }
        );
        let updatedLinkedModules = linkedModules;
        updatedLinkedModules[deviceIndex].sensorModules = filteredModules;
        setlinkedModules(updatedLinkedModules);
      }
    } catch (error) {
      alert(error.message);
      console.log(error);
    }
  };

  const renderDeleteModal = (
    event: any,
    moduleID: string,
    deviceID: number,
    deviceIndex: number
  ): void => {
    confirm({
      title: `Are you sure you want to unlink #${moduleID}?`,
      content:
        'Your existing data can still be accessed, but you will need to re-add your sensor module to \
             a gateway in order to receive new data.',
      onOk: () => handleOkUnlinkModule(moduleID, deviceID, deviceIndex)
    });
  };

  const addSensorModules = (event: any, gatewayID: number): void => {
    props.history.push(`/devices/${gatewayID}/add_sensor_modules`);
    setSelectedDevice(gatewayID);
    sensorContext.actions.setGateway(gatewayID);
  };

  const showGatewayOptions = (gatewayID: number): void => {
    let selectedOptions: Array<number> = [...displayGatewayOptions, gatewayID];
    if (displayGatewayOptions.includes(gatewayID)) {
      selectedOptions = displayGatewayOptions.filter(gateway => {
        return gateway !== gatewayID;
      });
    }
    setdisplayGatewayOptions(selectedOptions);
  };

  const toggleEditGateway = (gatewayID: number): void => {
    let gatewaySet: Array<number> = [...editingGateways, gatewayID];
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
   * @param deviceID
   * @param index
   */
  const renderSensorModules = (
    deviceID: number,
    index: number
  ): React.ReactNode => {
    ModeConnection.openConnection();
    if (linkedModules && linkedModules[index]) {
      const modules = linkedModules[index].sensorModules.map((sensor, key) => {
        return (
          <Fragment key={key}>
            {!isLoading ? (
              <a
                key={key}
                className={`sensor-module ${sensor.value.sensing}`}
                onClick={event => {
                  sessionStorage.setItem(
                    'selectedGateway',
                    deviceID.toString()
                  );
                  sessionStorage.setItem(
                    'selectedModule',
                    sensor.key.substring(
                      Constants.SENSOR_MODULE_KEY_PREFIX.length
                    )
                  );
                  goToSensorModule(event, sensor.key);
                }}
              >
                <img className="module-image" src={sensorGeneral} />
                <div className="module-info">
                  <div className="sensor-module-name">
                    {sensor.value.name ? sensor.value.name : sensor.key}
                  </div>
                  <div className="sensor-module-model">{sensor.value.id}</div>
                  {sensor.value.sensors &&
                    sensor.value.sensors.map((sensorType, sensorIndex) => {
                      const type = sensorType.split(':')[0];
                      return (
                        <img
                          key={sensorIndex}
                          className="sensor-type-image"
                          src={evaluateSensorTypes(type)}
                        />
                      );
                    })}
                </div>
              </a>
            ) : (
              <img src={loader} />
            )}
          </Fragment>
        );
      });
      return modules;
    } else {
      return <img src={loader} />;
    }
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
                <button
                  className="action-button settings"
                  onClick={() => showGatewayOptions(deviceId)}
                >
                  ...
                </button>
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
          {displayGatewayOptions.includes(deviceId) && (
            // if this gateway is being edited, show drop down
            <ul className="dropdown-menu">
              <a href="#" onClick={() => toggleEditGateway(deviceId)}>
                Unlink Sensor Modules
              </a>
            </ul>
          )}
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
        className={`gateway-sensor-modules ${
          isEditingDevice ? ' editing-module' : ''
        }`}
      >
        {!isEditingDevice // if this gateway is not being edited
          ? renderSensorModules(deviceId, deviceIndex)
          : isEditingDevice && // if this gateway is being edited
            sensorModules.map((sensor: SensorModuleInterface, key) => {
              return (
                <a
                  key={key}
                  className="sensor-module"
                  onClick={event =>
                    renderDeleteModal(event, sensor.key, deviceId, deviceIndex)
                  }
                >
                  <img className="module-image" src={sensorGeneral} />
                  <div className="module-info">
                    <div className="x-icon">x</div>
                    <div className="sensor-module-name">{sensor.key}</div>
                    <div className="sensor-module-model">{sensor.value.id}</div>
                    {sensor.value.sensors &&
                      sensor.value.sensors.map((sensorType, sensorIndex) => {
                        // TODO: add logic for rendering sensor type images
                        const type = sensorType.split(':')[0];
                        return (
                          <img
                            key={sensorIndex}
                            className="sensor-type-image"
                            src={evaluateSensorTypes(type)}
                          />
                        );
                      })}
                  </div>
                </a>
              );
            })}
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
          ) : (
            // If linkedModules is empty AND we are not loading data, this mean the home
            // does not have any device
            !isLoading ? (
              <div className="gateway-row no-device">
                You don't have any device. Please use the
                <a href="https://console.tinkermode.com" target="blank"> Mode Console </a>
                to create and add devices to your home.
              </div>
            ) : (
              <img src={loader} />
            )
          )}
        </div>
      </div>
    </div>
  );
});

export default Hardware;
