import React, { Fragment, useState, useEffect } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';
import SensorModuleSet from '../components/entities/SensorModule';
import { Modal } from 'antd';
import { Context, ContextConsumer } from '../context/Context';
import ModeConnection from '../controllers/ModeConnection';
import { SensorModule } from './index';
const { confirm } = Modal;
// TODO: implement image specific rendering
const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');

const sensorHumidity = require('../common_images/sensors/humidity-active.svg');
const sensorLight = require('../common_images/sensors/uv-active.svg');
const sensorUV = require('../common_images/sensors/uv-active.svg');
const sensorPressure = require('../common_images/sensors/pressure-active.svg');
const sensorTemp = require('../common_images/sensors/temp-active.svg');
const sensorCount = require('../common_images/sensors/count-active.svg');
const sensorMagnetic = require('../common_images/sensors/battery-active.svg');
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
  const [selectedGateway, setselectedGateway] = useState<string>();
  const [editingGateways, seteditingGateways] = useState<Array<string>>([]);
  const [targetedModule, setTargetedModule] = useState<string>('');
  const [moduleInDeleteMode, setmoduleInDeleteMode] = useState<string>('');

  useEffect(
    () => {
        AppContext.restoreLogin(); // restore user credentials and get home / associated devices
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            modeAPI
            .getDevices(response.id)
            .then((deviceResponse: any) => {
                setDevices(deviceResponse);
                if (deviceResponse.length > 0) {
                      let deviceBundles = linkedModules;
                      deviceResponse.forEach((device: any, index: any) => {  // for each device, set linked modules
                      const url = MODE_API_BASE_URL + 'devices/' + device.id + '/kv';
                      setIsLoading(true);
                      modeAPI
                      .request('GET', url, {})
                      .then((sensorModules: any) => {
                          const filteredModules = sensorModules.data.filter((sModule: any) => {
                            return sModule.key !== 'firmwareVersion' && sModule.key !== 'firmwareDistribution';
                          });
                          const deviceBundle: SensorModuleSet = { // create sensor module set
                          device: device.id,
                          sensorModules: filteredModules
                          };
                          if (!deviceBundles.includes(deviceBundle)) {
                            deviceBundles.push(deviceBundle);
                          }
                          setlinkedModules([...deviceBundles]); // set linked modules
                          if (sensorModules.status === 200 && index === deviceResponse.length - 1) {
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
    }, 
    [moduleInDeleteMode] // this argument outlines re-rendering dependencies
    );

  const goToSensorModule = (event: any, moduleID: string): void => {
    setTargetedModule(moduleID);
    props.history.push('/sensor_modules/' + moduleID);
  };

  const handleOk = (
    moduleID: string,
    deviceID: string,
    deviceIndex: number
  ) => {
    const url = MODE_API_BASE_URL + 'devices/' + deviceID + '/kv/' + moduleID;
    modeAPI.request('DELETE', url, {}).then((response: any) => {
      if (response.status === 204) {
        const filteredModules = linkedModules[deviceIndex].sensorModules.filter(
          sensor => {
            return sensor.key !== moduleID;
          }
        );
        let updatedLinkedModules = linkedModules;
        updatedLinkedModules[deviceIndex].sensorModules = filteredModules;
        setlinkedModules(updatedLinkedModules);
      }
    });
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

  const addSensorModules = (event: any, gatewayID: string, context: Context ): void => {
    props.history.push('/devices/' + gatewayID + '/add_sensor_modules');
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

  const evaluateSensorTypes = (sensorType: any): string | undefined => {
    switch (sensorType) {
      case 'TEMPERATURE':
        return sensorTemp;
      case 'HUMIDITY':
        return sensorHumidity;
      case 'AMBIENT':
        return sensorLight;
      case 'UV':
        return sensorUV;
      case 'PRESSURE':
        return sensorPressure;
      case 'MAGNETIC_X':
        return sensorMagnetic;
      case 'COUNT':
        return sensorCount;
      case 'ENY_CH_NO':
        return sensorCount;
      case 'ENY_SEQ_NO':
        return sensorCount;
      case 'ENY_CUM_NO':
        return sensorCount;
      default:
        console.log(sensorType);
        return;
    }
  };

  const renderSensorModules = (context: Context, deviceID: string, index: number): React.ReactNode => {
    const ws = ModeConnection.openConnection();
    if (ws !== undefined) {
      setTimeout(
        () => {
          context.actions.setWebsocket(ws);
        },
        2000
        );
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
              { !isLoading ?
              <a
                key={key}
                className="sensor-module"
                onClick={event => {
                  sessionStorage.setItem('selectedGateway', deviceID);
                  sessionStorage.setItem('selectedModule', sensor.key.split('sensorModule')[1]);
                  goToSensorModule(event, sensor.key);
                }}
              >
                <img
                  className="module-image"
                  src={sensorGeneral}
                />
                <div className="module-info">
                  <div className="sensor-module-name">
                    {sensor.key}
                  </div>
                  <div className="sensor-module-model">
                    {sensor.value.id}
                  </div>
                  { sensor.value.sensors &&
                    sensor.value.sensors.map(
                    (sensorType, sensorIndex) => {
                      const type = sensorType.split(':')[0];
                      return (
                        <img
                          key={sensorIndex}
                          className="sensor-type-image"
                          src={evaluateSensorTypes(type)}
                        />
                      );
                    }
                  )}
                </div>
              </a> :
              <img src={loader} />
              }
            </Fragment>
          );
        });
      return modules;
    } else {
      return (
        <img src={loader} />
      );
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
              {devices !== undefined && fetchComplete && 
                devices.map((device, index) => { // for each gateway, render the following
                  return (
                    <Fragment key={index}>
                      { !isLoading ?
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
                                    addSensorModules(event, device.id, context)
                                  }
                                >
                                  + Add Sensor Modules
                                </button>
                                <button
                                  className="action-button settings"
                                  onClick={() => showGatewayOptions(device.id)}
                                >
                                  ...
                                </button>
                              </>
                            ) : ( // if it is being edited, show done button
                              <>
                                <button
                                  className="done-button"
                                  onClick={() => toggleEditGateway(device.id)}
                                >
                                  Done
                                </button>
                              </>
                            )}
                          </Fragment>
                          {displayGatewayOptions.includes(device.id) && (  
                            // if this gateway is being edited, show drop down
                            <ul className="dropdown-menu">
                              <a
                                href="#"
                                onClick={() => toggleEditGateway(device.id)}
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
                        {!editingGateways.includes(device.id) ?
                          // if this gateway is not being edited
                          renderSensorModules(context, device.id, index)
                          : editingGateways.includes(device.id) && // if this gateway is not being edited
                            linkedModules[index] && linkedModules[index].sensorModules.length > 0  &&
                            linkedModules[index] &&
                            linkedModules[index].device === device.id &&
                            linkedModules[index].sensorModules.map(
                              (sensor, key) => {
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
                                          const type = sensorType.split(':')[0];
                                          return (
                                            <img
                                              key={sensorIndex}
                                              className="sensor-type-image"
                                              src={evaluateSensorTypes(type)}
                                            />
                                          );
                                        }
                                      )}
                                    </div>
                                  </a>
                                );
                              }
                            )}
                      </div>
                    </div> :
                    <img src={loader} />
                      }
                    </Fragment>
                  );
                })}
            </div>
          </div>
        ) : 
        ( // sensor module specific path, render sensor module details
          <Fragment>
            <SensorModule 
              isLoggedIn={true}
            />
          </Fragment>
        )}
      </div>
      )
    }
    </ContextConsumer>
  );
});

export default Hardware;
