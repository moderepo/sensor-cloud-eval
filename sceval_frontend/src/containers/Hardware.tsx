import React, { Fragment, useState, useEffect } from 'react';
import { Redirect, RouteComponentProps, withRouter } from 'react-router';
import { LeftNav } from '../components/LeftNav';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import AppContext from '../controllers/AppContext';
import { SensorModule } from '../containers/SensorModule';
import SensorModuleSet from '../components/entities/SensorModule';
import { Modal } from 'antd';
const { confirm } = Modal;
// TODO: implement image specific rendering
const enySensor = require('../common_images/sensors/eny-sensor.png');
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

const Hardware = withRouter((props: HardwareProps & RouteComponentProps) => {
  const [devices, setDevices] = useState<Array<any>>();
  const [linkedModules, setlinkedModules] = useState<Array<SensorModuleSet>>(
    []
  );
  const [selectedDevice, setselectedDevice] = useState<string>('');
  const [displayGatewayOptions, setdisplayGatewayOptions] = useState<
    Array<string>
  >([]);
  const [editingGateways, seteditingGateways] = useState<Array<string>>([]);
  const [targetedModule, settargetedModule] = useState<string>('');
  const [moduleInDeleteMode, setmoduleInDeleteMode] = useState<string>('');

  useEffect(
    () => {
        AppContext.restoreLogin(); // restore user credentials and get home / associated devices
        modeAPI
        .getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            modeAPI
            .getDevices(response.id)
            .then((deviceResponse: any) => {
                setDevices(deviceResponse);
            })
            .then(() => {
                if (devices !== undefined) {
                devices.forEach((device: any) => {
                    const url = MODE_API_BASE_URL + 'devices/' + device.id + '/kv';
                    modeAPI
                    .request('GET', url, {})
                    .then((sensorModules: any) => {
                        const deviceBundle: SensorModuleSet = {
                        device: device.id,
                        sensorModules: sensorModules.data.slice(
                            1,
                            sensorModules.data.length
                        )
                        };
                        setlinkedModules([...linkedModules, deviceBundle]);
                    })
                    .catch((reason: any) => {
                        console.log('error posting to the kv store', reason);
                    });
                });
                }
            });
        });
    }, 
    [devices !== undefined && devices.length, moduleInDeleteMode] // this argument outlines re-rendering dependencies
    );

  const goToSensorModule = (event: any, moduleID: string): void => {
    setselectedDevice(moduleID);
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
        console.log(filteredModules);
        linkedModules[deviceIndex].sensorModules = filteredModules;
        setlinkedModules(linkedModules);
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

  const addSensorModules = (event: any, gatewayID: string): void => {
    props.history.push('/devices/' + gatewayID + '/add_sensor_modules');
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

  if (!props.isLoggedIn) {
    return <Redirect to="/login" />;
  }
  return (
    <div>
      <LeftNav />
      {props.history.location.pathname === '/devices' ? (
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
              devices.map((device, index) => {
                return (
                  <div
                    key={index}
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
                            <>
                              <button
                                className="action-button"
                                onClick={event =>
                                  addSensorModules(event, device.id)
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
                          ) : (
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
                      {!editingGateways.includes(device.id) &&
                      linkedModules.length > 0
                        ? linkedModules[index].sensorModules.map(
                            (sensor, key) => {
                              return (
                                <a
                                  key={key}
                                  className="sensor-module"
                                  onClick={event =>
                                    goToSensorModule(event, sensor.key)
                                  }
                                >
                                  <img
                                    className="module-image"
                                    src={enySensor}
                                  />
                                  <div className="module-info">
                                    <div className="sensor-module-name">
                                      {sensor.key}
                                    </div>
                                    <div className="sensor-module-model">
                                      {sensor.value.id}
                                    </div>
                                    {sensor.value.sensors.map(
                                      (sensorType, sensorIndex) => {
                                        // TODO: add logic for rendering sensor type images
                                        return (
                                          <img
                                            key={sensorIndex}
                                            className="sensor-type-image"
                                            src={sensorTemp}
                                          />
                                        );
                                      }
                                    )}
                                  </div>
                                </a>
                              );
                            }
                          )
                        : linkedModules.length > 0 &&
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
                                    src={sensorModule}
                                  />
                                  <div className="module-info">
                                    <div className="x-icon">x</div>
                                    <div className="sensor-module-name">
                                      {sensor.key}
                                    </div>
                                    <div className="sensor-module-model">
                                      {sensor.value.id}
                                    </div>
                                    {sensor.value.sensors.map(
                                      (sensorType, sensorIndex) => {
                                        // TODO: add logic for rendering sensor type images
                                        return (
                                          <img
                                            key={sensorIndex}
                                            className="sensor-type-image"
                                            src={sensorTemp}
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
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <Fragment>
          <LeftNav />
          <SensorModule isLoggedIn={true} />
        </Fragment>
      )}
    </div>
  );
});

export default Hardware;
