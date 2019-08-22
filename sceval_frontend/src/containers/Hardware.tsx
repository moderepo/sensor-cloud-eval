import React, { Fragment, useState, useEffect } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI, { ModeAPI, KeyValueStore, ErrorResponse } from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';
import SensorModuleSet, { SensorModuleInterface } from '../components/entities/SensorModule';
import { evaluateSensorTypes } from '../utils/SensorTypes';
import { Modal } from 'antd';
import { Context, ContextConsumer } from '../context/Context';
import ModeConnection from '../controllers/ModeConnection';
import { SensorModule } from './index';
const { confirm } = Modal;

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const deviceImage = require('../common_images/devices/gateway.svg');
const deviceLocation = require('../common_images/devices/location-pin.svg');

const MODE_API_BASE_URL = 'https://api.tinkermode.com/';
interface HardwareProps extends React.Props<any> {
  isLoggedIn: boolean;
  onLogIn: () => void;
}

const Hardware = withRouter((props: HardwareProps & RouteComponentProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchComplete, setFetchComplete] = useState<boolean>(false);
  const [devices, setDevices] = useState<Array<any>>();
  const [linkedModules, setlinkedModules] = useState<Array<SensorModuleSet>>(
    []
  );
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [displayGatewayOptions, setdisplayGatewayOptions] = useState<
    Array<string>
  >([]);
  const [editingGateways, seteditingGateways] = useState<Array<string>>([]);
  const [targetedModule, setTargetedModule] = useState<string>('');
  const [moduleInDeleteMode, setmoduleInDeleteMode] = useState<string>('');

  useEffect(() => {
    AppContext.restoreLogin(); // restore user credentials and get home / associated devices
    modeAPI
      .getHome(ClientStorage.getItem('user-login').user.id)
      .then((response: any) => {
        modeAPI.getDevices(response.id).then((deviceResponse: any) => {
          setDevices(deviceResponse);
          if (deviceResponse.length > 0) {
            let deviceBundles = linkedModules;
            deviceResponse.forEach((device: any, index: any) => {
              // for each device, set linked modules
              setIsLoading(true);
              modeAPI.getAllDeviceKeyValueStoreByPrefix(device.id, 'sensorModule')
                .then((sensorModules: KeyValueStore[]) => {
                  const deviceBundle: SensorModuleSet = {
                    // create sensor module set
                    device: device.id,
                    sensorModules: sensorModules
                  };
                  if (!deviceBundles.includes(deviceBundle)) {
                    deviceBundles.push(deviceBundle);
                  }
                  setlinkedModules([...deviceBundles]); // set linked modules
                  if (deviceBundles.length === deviceResponse.length) {
                    setFetchComplete(true);
                    setIsLoading(false);
                  }
                })
                .catch((reason: any) => {
                  console.log('error posting to the kv store', reason);
                });
            });
          }
        });
      });

    // Listen to _keyValueSaved_ event from the web socket and reload the sensor module
    // data for the module that triggered the event.
    const messageHandler: any = {
      notify: (message: any): void => {
        if (message.eventType === '_keyValueSaved_' && message.eventData && linkedModules !== undefined) {
          // message.eventData will be the key/value store for the sensorModule
          const updatedSensorModule: SensorModuleInterface = message.eventData;

          // Find the linked module that has a sensor module with the same key and at the same time, find the deviceId
          // of the device the module is connected to because we need the deviceId to make an API call to load the
          // module data
          interface Findable {
            deviceId: string;
            sensorModule: SensorModuleInterface;
          }

          // First, build an array of Findable and then find the sensor module that has the same
          // key as the module that triggered the event
          const result = linkedModules.reduce(
            (prevValue: Findable[], currValue: SensorModuleSet): Findable[] => {
              return [...prevValue, ...currValue.sensorModules.map((module: SensorModuleInterface): Findable => {
                return {
                  deviceId: currValue.device,
                  sensorModule: module,
                };
              })];
            },
            []).find((findable: Findable): boolean => {
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
  },        []); // this argument outlines re-rendering dependencies

  const goToSensorModule = (event: any, moduleID: string): void => {
    setTargetedModule(moduleID);
    props.history.push('/sensor_modules/' + moduleID);
  };

  const handleOk = async (
    moduleID: string,
    deviceID: string,
    deviceIndex: number
  ) => {
    try {
      const status: number = await modeAPI.deleteDeviceKeyValueStore(deviceID, moduleID);
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
    deviceID: string,
    deviceIndex: number
  ): void => {
    setmoduleInDeleteMode(moduleID);
    confirm({
      title: `Are you sure you want to unlink #${moduleID}?`,
      content:
        'Your existing data can still be accessed, but you will need to re-add your sensor module to \
             a gateway in order to receive new data.',
      onOk: () => handleOk(moduleID, deviceID, deviceIndex)
    });
  };

  const addSensorModules = (
    event: any,
    gatewayID: string,
    context: Context
  ): void => {
    props.history.push(`/devices/${gatewayID}/add_sensor_modules`);
    setSelectedDevice(gatewayID);
    context.actions.setGateway(gatewayID);
  };

  const showGatewayOptions = (gatewayID: string): void => {
    let selectedOptions: Array<string> = [...displayGatewayOptions, gatewayID];
    if (displayGatewayOptions.includes(gatewayID)) {
      selectedOptions = displayGatewayOptions.filter(gateway => {
        return gateway !== gatewayID;
      });
    }
    setdisplayGatewayOptions(selectedOptions);
  };

  const toggleEditGateway = (gatewayID: string): void => {
    let gatewaySet: Array<string> = [...editingGateways, gatewayID];
    if (editingGateways.includes(gatewayID)) {
      gatewaySet = editingGateways.filter(gateway => {
        return gateway !== gatewayID;
      });
    } else {
      showGatewayOptions(gatewayID);
    }
    seteditingGateways(gatewaySet);
  };

  const renderSensorModules = (
    context: Context,
    deviceID: string,
    index: number
  ): React.ReactNode => {
    const ws = ModeConnection.openConnection();
    if (ws !== undefined) {
      setTimeout(() => {
        context.actions.setWebsocket(ws);
      },         2000);
    }
    if (linkedModules && linkedModules[index]) {
      const sortedLinkedModules = linkedModules.sort(function(a: any, b: any) {
        if (a.device < b.device) {
          return -1;
        }
        if (a.device > b.device) {
          return 1;
        }
        return 0;
      });
      const modules = sortedLinkedModules[index].sensorModules.map(
        (sensor, key) => {
          ModeConnection.listSensorModules(deviceID);
          return (
            <Fragment key={key}>
              {!isLoading ? (
                <a
                  key={key}
                  className={`sensor-module ${sensor.value.sensing}`}
                  onClick={event => {
                    sessionStorage.setItem('selectedGateway', deviceID);
                    sessionStorage.setItem(
                      'selectedModule',
                      sensor.key.split('sensorModule')[1]
                    );
                    goToSensorModule(event, sensor.key);
                  }}
                >
                  <img className="module-image" src={sensorGeneral} />
                  <div className="module-info">
                    <div className="sensor-module-name">
                    {sensor.value.name ? sensor.value.name : sensor.key}</div>
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
        }
      );
      return modules;
    } else {
      return <img src={loader} />;
    }
  };

  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }
  return (
    <ContextConsumer>
      {(context: Context) =>
        context && (
          <div>
            <LeftNav />
            {props.history.location.pathname === '/devices' ? ( // /devices path, render gateway set
              <div className="hardware-section">
                <div className="page-header">
                  {selectedDevice === '' ? (
                    <h1>Hardware</h1>
                  ) : (
                    <h1>Add Sensor Modules</h1>
                  )}
                </div>
                <div className="gateways-section">
                  {devices !== undefined &&
                    fetchComplete &&
                    devices.map((device, index) => {
                      // for each gateway, render the following
                      return (
                        <Fragment key={index}>
                          {!isLoading ? (
                            <div
                              key={device.id}
                              className={
                                editingGateways.includes(device.id)
                                  ? 'gateway-row editing-gateway'
                                  : 'gateway-row'
                              }
                            >
                              <div className="gateway-header">
                                <div className="gateway-info">
                                  <img src={deviceImage} />
                                  <div className="gateway-id">{`Gateway-${
                                    device.id
                                  }`}</div>
                                  <div className="gateway-name">
                                    <img
                                      className="gateway-location"
                                      src={deviceLocation}
                                    />
                                    {device.name}
                                  </div>
                                </div>
                                <div className="gateway-settings">
                                  <Fragment>
                                    {!editingGateways.includes(device.id) ? (
                                      // if this gateway is not being edited, show normal setting
                                      <>
                                        <button
                                          className="action-button"
                                          onClick={event =>
                                            addSensorModules(
                                              event,
                                              device.id,
                                              context
                                            )
                                          }
                                        >
                                          + Add Sensor Modules
                                        </button>
                                        <button
                                          className="action-button settings"
                                          onClick={() =>
                                            showGatewayOptions(device.id)
                                          }
                                        >
                                          ...
                                        </button>
                                      </>
                                    ) : (
                                      // if it is being edited, show done button
                                      <>
                                        <button
                                          className="done-button"
                                          onClick={() =>
                                            toggleEditGateway(device.id)
                                          }
                                        >
                                          Done
                                        </button>
                                      </>
                                    )}
                                  </Fragment>
                                  {displayGatewayOptions.includes(
                                    device.id
                                  ) && (
                                    // if this gateway is being edited, show drop down
                                    <ul className="dropdown-menu">
                                      <a
                                        href="#"
                                        onClick={() =>
                                          toggleEditGateway(device.id)
                                        }
                                      >
                                        Unlink Sensor Modules
                                      </a>
                                    </ul>
                                  )}
                                </div>
                              </div>
                              <div
                                className={
                                  editingGateways.includes(device.id)
                                    ? 'gateway-sensor-modules editing-module'
                                    : 'gateway-sensor-modules'
                                }
                              >
                                {!editingGateways.includes(device.id)
                                  ? // if this gateway is not being edited
                                    renderSensorModules(
                                      context,
                                      device.id,
                                      index
                                    )
                                  : editingGateways.includes(device.id) && // if this gateway is not being edited
                                    linkedModules[index] &&
                                    linkedModules[index].sensorModules.length >
                                      0 &&
                                    linkedModules[index] &&
                                    linkedModules[index].device === device.id &&
                                    linkedModules.sort(function(a: any, b: any) {
                                      if (a.device < b.device) {
                                        return -1;
                                      }
                                      if (a.device > b.device) {
                                        return 1;
                                      }
                                      return 0;
                                    })[index].sensorModules.map((sensor, key) => {
                                        return (
                                          <a
                                            key={key}
                                            className="sensor-module"
                                            onClick={event =>
                                              renderDeleteModal(
                                                event,
                                                sensor.key,
                                                device.id,
                                                index
                                              )
                                            }
                                          >
                                            <img
                                              className="module-image"
                                              src={sensorGeneral}
                                            />
                                            <div className="module-info">
                                              <div className="x-icon">x</div>
                                              <div className="sensor-module-name">
                                                {sensor.key}
                                              </div>
                                              <div className="sensor-module-model">
                                                {sensor.value.id}
                                              </div>
                                              {sensor.value.sensors &&
                                                sensor.value.sensors.map(
                                                  (sensorType, sensorIndex) => {
                                                    // TODO: add logic for rendering sensor type images
                                                    const type = sensorType.split(
                                                      ':'
                                                    )[0];
                                                    return (
                                                      <img
                                                        key={sensorIndex}
                                                        className="sensor-type-image"
                                                        src={evaluateSensorTypes(
                                                          type
                                                        )}
                                                      />
                                                    );
                                                  }
                                                )}
                                            </div>
                                          </a>
                                        );
                                      })}
                              </div>
                            </div>
                          ) : (
                            <img src={loader} />
                          )}
                        </Fragment>
                      );
                    })}
                </div>
              </div>
            ) : (
              // sensor module specific path, render sensor module details
              <Fragment>
                <SensorModule isLoggedIn={true} />
              </Fragment>
            )}
          </div>
        )
      }
    </ContextConsumer>
  );
});

export default Hardware;
