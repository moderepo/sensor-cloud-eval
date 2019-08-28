import React, { useEffect, useState, Fragment, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { Context, context } from '../context/Context';
import { KeyValueStore, ErrorResponse, TimeSeriesData, TimeSeriesInfo } from '../components/entities/API';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import moment from 'moment';
import { Menu, Dropdown, Icon, Checkbox, Modal, Input } from 'antd';
import ModeConnection  from '../controllers/ModeConnection';
import determinUnit from '../utils/SensorTypes';
import { SensorModuleInterface } from '../components/entities/SensorModule';
import { Constants } from '../utils/Constants';
import { Home } from '../components/entities/API';

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
const fullALPsList = ['TEMPERATURE:0', 'HUMIDITY:0', 'UV:0', 'PRESSURE:0', 'AMBIENT:0', 
    'MAGNETIC_X:0', 'ACCELERATION_Y:0', 'ACCELERATION_Z:0', 'MAGNETIC_Y:0', 
    'MAGNETIC_Z:0', 'ACCELERATION_X:0'];

interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}
interface SensingInterval {
    value: number;
    unit: string;
    multiplier: number;
}

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps) => {
    const [homeId, setHomeId] = useState<number>(0);
    const [selectedModule, setSelectedModule] = useState<string|null>();
    const [sensorModuleName, setSensorModuleName] = useState<string>();
    const [selectedSensorModuleObj, setSelectedSensorModuleObj] = useState<SensorModuleInterface|null>();
    const [selectedGateway, setSelectedGateway] = useState<number>(0);
    const [TSDBDataFetched, setTSDBDataFetched] = useState<boolean>(false);
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(0);
    const [activeSensors, setActiveSensors] = useState<any>(); // contains RT Websocket data
    const [newWebsocketData, setNewWebsocketData] = useState<boolean>(false);
    const [sensorTypes, setSensorTypes] = useState<Array<any>>(); // contains data from TSDB fetch
    const [batteryPower, setBatteryPower] = useState<number>(0.1); // TODO: update battery power.
    const [graphTimespanNumeric, setGraphTimespanNumeric] = useState<any>(15);
    const [graphTimespan, setGraphTimespan] = useState<string>('minutes');
    const [fullSensorList, setFullSensorList] = useState();
    const [offlineSensors, setOfflineSensors] = useState<Array<any>>([]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [moduleSettingsVisible, setModuleSettingsVisible] = useState<boolean>(false);
    const [editingModuleSettings, setEditingModuleSettings] = useState(false);
    const sensorContext: Context = useContext(context);
    
    const performTSDBFetch =  
    (homeID: number, sensors: any, 
     sType: string, seriesID: string, unit: string, wsData: any ) => {
        //  set now as reference point
        const now = new Date();
        const endTime = moment(now);
        // determine start time
        const startTime = moment(now).subtract(
            graphTimespanNumeric === '' ?
                1 : graphTimespanNumeric, 
            graphTimespan === 'real-time' ?
                'minute' : graphTimespan);

        modeAPI.getTSDBData(homeID, seriesID, startTime.toISOString(), endTime.toISOString())
        .then((timeseriesData: TimeSeriesData) => {
            let maxVal = 0;
            let minVal = Infinity;
            let sum = 0;
            
            // for each set of TSDB data, perform a calculation
            timeseriesData.data.forEach((datapoint: any, datapointIndex: any) => {
                sum += datapoint[1];
                if (datapoint[1] > maxVal) {
                    maxVal = datapoint[1];
                }
                if (datapoint[1] < minVal) {
                    minVal = datapoint[1];
                }
                if (datapointIndex === timeseriesData.data.length - 1) {
                    const sensorData = {
                        seriesID: seriesID,
                        unit: unit,
                        type: sType,
                        TSDBData: timeseriesData,
                        avgVal: sType !== 'uv' ? 
                            (sum / datapointIndex).toFixed(1) : (sum / datapointIndex).toFixed(3),
                        maxVal: sType !== 'uv' ?
                            maxVal.toFixed(1) : maxVal.toFixed(3),
                        minVal: sType !== 'uv' ?
                            minVal.toFixed(1) : minVal.toFixed(3)
                    };
                    // push that data to sensorData
                    sensors.push(sensorData);
                }
                // bundle data after going through sensor set
                if (sensors.length === wsData.length) {
                    // if all of the sensor data has been populated, sort it alphabetically by type
                    const sortedTSDBData = sensors.sort((a: any, b: any) =>  {
                        if (a.type < b.type) {
                            return -1;
                        }
                        if (a.type > b.type) {
                            return 1;
                        }
                        return 0;
                    });
                    // set TSDB values
                    if (!TSDBDataFetched) {
                        setSensorTypes(sortedTSDBData);
                        setTSDBDataFetched(true);
                    }
                }
            });
        });
    };

    /**
     * This useEffect does not depend on any state so it will only get called once, when the component is mounted
     */
    useEffect(
        () => {
            // restore login
            AppContext.restoreLogin();

            // open new connection for refresh
            ModeConnection.openConnection(); 

            // get home id
            modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
            .then((home: Home): void => {
                setHomeId(home.id);
            });

            // get selected device and module
            const gateway: number = Number(sessionStorage.getItem('selectedGateway'));
            const sensorModule = sessionStorage.getItem('selectedModule');
            setSelectedModule(sensorModule);
            setSelectedGateway(gateway);
    },  []);

    // React hook's componentDidMount and componentDidUpdate
    useEffect(
        () => {
            if (homeId !== 0 && selectedGateway && selectedModule) {

                // fetch module data from KV store
                modeAPI.getDeviceKeyValueStore(
                    selectedGateway, `${Constants.SENSOR_MODULE_KEY_PREFIX}${selectedModule}`
                ).then((keyValueStore: KeyValueStore) => {
                    setSelectedSensorModuleObj(keyValueStore);
                    
                    const moduleSensors = keyValueStore.value.sensors;
                    // set name of sensor
                    setSensorModuleName(keyValueStore.value.name);
                    // set full sensor list and quantity
                    setFullSensorList(moduleSensors);
                    setActiveSensorQuantity(moduleSensors.length);
                    // determine offline sensors
                    let sensorsOffline: any = fullALPsList.filter((sensor: any): boolean => {
                        return !keyValueStore.value.sensors.includes(sensor);
                    });
                    setOfflineSensors(sensorsOffline);

                    modeAPI.getTSDBInfo(homeId).then((tsdbInfo: TimeSeriesInfo[]) => {
                            // filter response initially by selected module
                            const filteredTSDBData: any = tsdbInfo.filter((tsdbData: any): boolean => {
                                return tsdbData.id.includes(selectedModule);
                            });
                            // filter again for online sensors
                            const onlineTSDBData: any = filteredTSDBData.filter((filteredData: any): boolean => {
                                const sensorType = filteredData.id.split('-')[1].toUpperCase();
                                return moduleSensors.includes(sensorType);
                            });
                            setOfflineSensors(sensorsOffline);
                            let sensors: any = [];
                            // for online sensors, perform TSDB fetch
                            if (onlineTSDBData.length > 0 && !TSDBDataFetched) {
                                onlineTSDBData.forEach((sensor: any, index: any) => {
                                    const format = sensor.id.split('-')[1];
                                    const sType = format.split(':')[0];
                                    const unit = determinUnit(sType);
                                    if (unit !== undefined) {
                                        performTSDBFetch(homeId, sensors, sType, sensor.id, unit, onlineTSDBData);
                                    }
                                });
                            }
                        });
                }).catch((error: ErrorResponse): void => {
                    alert(`Unable to get sensor module setting because of this error '${error.message}'`);
                    console.log(error);
                });
            }

            // websocket message handler for RT data
            const webSocketMessageHandler: any = {
                notify: (message: any): void => {
                    const moduleData = message;
                    // if app receives real time data, and it pertains to the selected Module:
                    if (homeId && moduleData.eventType === 'realtimeData' 
                    && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule)) {
                        setNewWebsocketData(false);
                        const wsData = moduleData.eventData.timeSeriesData;
                        let rtData: any = [];
                        let rtNumbers: any = [];
                        wsData.forEach((sensor: any, index: any) => {
                            const format = sensor.seriesId.split('-')[1];
                            // IMPORTANT: if user is choosing to view data from this sensor:
                            if (!offlineSensors.includes(format.toUpperCase())) {
                                const sType = format.split(':')[0];
                                rtData.push({
                                    seriesID: sensor.seriesId,
                                    type: sType,
                                    timestamp: sensor.timestamp,
                                    rtValue: sensor.value
                                });
                                rtNumbers.push({
                                    type: sType,
                                    val: sensor.value
                                });
                                if (index === wsData.length - 1) { // if we have gone through all RT data:
                                    if (activeSensors) {
                                        let updatedActiveArray: any = activeSensors;
                                        rtData.forEach((newSensor: any) => {
                                        // filter and check if activeSensors exists
                                            const dataExists = activeSensors.filter((onlineSensor: any): boolean => {
                                                return onlineSensor.type === newSensor.type;
                                            });
                                            // if the sensor already has previous data, update it
                                            if (dataExists.length === 1) {
                                                updatedActiveArray.forEach((updatedSensor: any) => {
                                                    if (updatedSensor.type === newSensor.type) {
                                                        updatedSensor.rtValue = newSensor.rtValue;
                                                    }
                                                });
                                            } else { // otherwise just simply push to new array and update
                                                updatedActiveArray.push(newSensor);
                                            }
                                        });
                                        // after loop finishes, set active sensors to updated 
                                        setActiveSensors(updatedActiveArray.sort((a: any, b: any) => {
                                            if (a.type < b.type) {
                                                return -1;
                                            }
                                            if (a.type > b.type) {
                                                return 1;
                                            }
                                            return 0;
                                        })); 
                                        setNewWebsocketData(true);
                                    } else {
                                        const sortedSensors = rtData.sort((a: any, b: any) => {
                                            if (a.type < b.type) {
                                                return -1;
                                            }
                                            if (a.type > b.type) {
                                                return 1;
                                            }
                                            return 0;
                                        }); 
                                        sensorContext.actions.setRTValues(rtNumbers);   
                                        setActiveSensors(sortedSensors); // set real time data
                                        setNewWebsocketData(true);
                                    }
                                }
                            }
                        });
                    }
                }
            };
            ModeConnection.addObserver(webSocketMessageHandler);
            // Return cleanup function to be called when the component is unmounted
            return (): void => {
                ModeConnection.removeObserver(webSocketMessageHandler);
            };
    },  [homeId, activeSensors, editingModuleSettings, selectedGateway, 
        selectedModule, TSDBDataFetched, graphTimespan, graphTimespanNumeric]);

    const toggleModalVisibility = () => {
        if (modalVisible) {
            setModuleSettingsVisible(false);
        }
        setModalVisible(!modalVisible);
    };
    
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setSensorModuleName(event.target.value);
    };
    const handleOk = (event: any) => {
        let filteredActiveSensors: any = fullALPsList.filter((sensor: any): boolean => {
            // if the user does not request the sensor to be turned off
            return !offlineSensors.includes(sensor);
        });
        // perform kv updates
        const sensorModule = sessionStorage.getItem('selectedModule');
        const device: number = Number(sessionStorage.getItem('selectedGateway'));
        if (device && sensorModule) {
           // copy the current selected sensor module object and replace the module's name and list of sensors
            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, selectedSensorModuleObj);
            if (sensorModuleName) {
                updatedSensorModuleObj.value.name = sensorModuleName;
            }
            updatedSensorModuleObj.value.sensors = filteredActiveSensors;

            // update KV store for the device
            modeAPI.setDeviceKeyValueStore(device, updatedSensorModuleObj.key, updatedSensorModuleObj)
            .then((deviceResponse: any) => {
                setEditingModuleSettings(true);
                return deviceResponse;
            }).catch((reason: any) => {
                console.error('reason', reason);
            });
        }
        setEditingModuleSettings(false); // re-render changes
        setModuleSettingsVisible(false); // hide module settings
        setModalVisible(false); // hide modal
    };

    const adjustOfflineSensors = (sensorType: string) => {
        // if offline sensors includes toggled sensor:
        if (offlineSensors.includes(sensorType)) {
            // remove it from offline sensors
            const removedSet = offlineSensors.filter((sensor: any) => {
                return sensor !== sensorType;
            });
            setOfflineSensors(removedSet);     
        } else {
            // if it doesn't, add it to offline sensors
            const addedSet: any = offlineSensors;
            addedSet.push(sensorType);
            setOfflineSensors(addedSet);
        }
    };

    const toggleSensorModuleSettingsVisible = () => {
        setModuleSettingsVisible(!moduleSettingsVisible);
    };

    const toggleGraphTimespan = (quantity: number, timespan: string): void => {
        let sensorSet: any = [];
        // set TSDB data flag to false
        setTSDBDataFetched(false);
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            const homeID = response.id;
            setGraphTimespanNumeric(quantity);
            setGraphTimespan(timespan);
            if (sensorTypes !== undefined) {
                // map through active sensors and perform fetch
                sensorTypes.forEach((sensor: any, index: any) => {
                    performTSDBFetch(
                    homeID, sensorSet, sensor.type, sensor.seriesID,
                    sensorTypes[index].unit, sensorTypes);
                });
            }
        });
        setGraphTimespanNumeric(quantity);
        setGraphTimespan(timespan);
    };

    const renderGraphTimespanToggle = (): React.ReactNode => {
        const timespanSet = [];
        timespanSet.push({ quantity: 1, unit: 'minute'});
        timespanSet.push({ quantity: 15, unit: 'minutes'});
        timespanSet.push({ quantity: 1, unit: 'hour'});
        timespanSet.push({ quantity: 8, unit: 'hours'});
        timespanSet.push({ quantity: 24, unit: 'hours'});
        timespanSet.push({ quantity: 7, unit: 'days'});
        timespanSet.push({ quantity: 30, unit: 'days'});

        const menu = (
            <Menu>
                {   timespanSet.map((timespan: any, index: any) => {
                        return (
                            <Menu.Item key={index}>
                                <option 
                                    value={timespan.quantity}
                                    onClick={() => toggleGraphTimespan(
                                        timespan.unit === 'minute' ?
                                            '' : timespan.quantity, 
                                        timespan.unit === 'minute' ?
                                        'real-time' : timespan.unit)}
                                >
                                {timespan.unit === 'minute' ?
                                    'real-time' : `${timespan.quantity} ${timespan.unit}`}
                                </option>
                            </Menu.Item>
                        );
                    })
                }
            </Menu>
        );
        return (
            <Dropdown overlay={menu} className="dropdown">
                <a className="default-timespan-value sensing-interval">
                    {`${graphTimespanNumeric} ${graphTimespan}`}
                    <Icon type="down" />
                </a>
            </Dropdown>
        );
    };

    const setSensingInterval = 
        (sensorModuleObj: SensorModuleInterface | null | undefined, interval: SensingInterval): void => {
        if (selectedGateway && sensorModuleObj && interval && interval.value > 0 &&
            sensorModuleObj.value.interval !== (interval.value * interval.multiplier)) {

            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, sensorModuleObj);
            updatedSensorModuleObj.value.interval = interval.value * interval.multiplier;
            modeAPI.setDeviceKeyValueStore(selectedGateway, sensorModuleObj.key, updatedSensorModuleObj).then(
                (status: number): void => {
                // now update the state
                setSelectedSensorModuleObj(updatedSensorModuleObj);
            },  (error: any): void => {
                alert('Unable to update device key value store');
                console.log('Unable to update device key value store', error);
            });
        }
    };

    const renderSensingIntervalOptions = (sensorModuleObj: SensorModuleInterface|null|undefined): React.ReactNode => {
        if (!sensorModuleObj) {
            return null;
        }

        const intervalSet: SensingInterval[] = [];
        intervalSet.push({ value: 2, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 5, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 10, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 15, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 30, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 1, unit: 'minutes', multiplier: 60});
        intervalSet.push({ value: 5, unit: 'minutes', multiplier: 60});
        intervalSet.push({ value: 10, unit: 'minutes', multiplier: 60});

        const menu = (
            <Menu>
                {   intervalSet.map((interval: SensingInterval, index: any) => {
                        return (
                            <Menu.Item key={index}>
                                <option 
                                    value={interval.value}
                                    onClick={() => setSensingInterval(sensorModuleObj, interval)}
                                >
                                    {interval.value} {interval.unit}
                                </option>
                            </Menu.Item>
                        );
                    })
                }
            </Menu>
        );

        let selectedInterval: SensingInterval | undefined = intervalSet.find((interval: SensingInterval): boolean => {
            return sensorModuleObj.value.interval === interval.value * interval.multiplier;
        });
        if (!selectedInterval) {
            selectedInterval = {
                value: sensorModuleObj.value.interval,
                unit: 'Seconds',
                multiplier: 1
            };
        }

        return (
            <Dropdown overlay={menu} className="dropdown">
                <a className="default-timespan-value">
                    {selectedInterval.value} {selectedInterval.unit.charAt(0)}
                    <Icon type="down" />
                </a>
            </Dropdown>
        );
    };

    return (
        <Fragment>
            <div className="module-section">
                <NavLink 
                    to="/devices"
                    onClick={() => sessionStorage.clear()}
                    className="back-button"
                >
                <img
                    src={backArrow} 
                    className="back-arrow"
                />
                Back to Hardware Overview
                </NavLink>
                <div className="module-container">
                    <div className="module-details">
                        <div className="module-left-container">
                            <img src={sensorGeneral} />
                            <div className="info-section">
                                <div className="device-name">
                                {sensorModuleName ? sensorModuleName : selectedModule}
                                </div>
                                <div className="gateway-name">Gateway name: {selectedGateway}</div>
                                <div className="sensor-model">Sensor model: {selectedModule} </div>
                            </div>
                            <button
                                onClick={toggleSensorModuleSettingsVisible}
                            >
                                •••
                            </button>
                            {
                                moduleSettingsVisible &&
                                <ul className="dropdown-menu">
                                <a
                                    href="#"
                                    onClick={toggleModalVisibility}
                                >
                                    Edit Settings
                                </a>
                                </ul>
                            }
                            {
                                modalVisible &&
                                <Modal
                                    title="Sensor Module Settings"
                                    visible={modalVisible}
                                    onOk={handleOk}
                                    onCancel={toggleModalVisibility}
                                >
                                <div className="sensor-module-form">
                                    <div className="sensor-module-name">
                                        <label className="label-title">Sensor Module Name</label>
                                        <Input
                                            value={sensorModuleName}
                                            onChange={handleNameChange}
                                            placeholder={
                                                sensorModuleName ? sensorModuleName :
                                                selectedModule ? selectedModule : '' 
                                            }
                                        />
                                    </div>
                                    <div className="sensor-types">
                                        <label className="label-title">Select Types of Data to Collect</label>
                                        {
                                            sensorTypes && fullSensorList && 
                                            fullALPsList.map((sensorType: any, index: any)  => {
                                                const displayed = sensorType.split(':')[0];
                                                return (
                                                    <Checkbox 
                                                        key={sensorType}
                                                        value={displayed}
                                                        onClick={() => adjustOfflineSensors(sensorType)}
                                                        defaultChecked={fullSensorList.includes(sensorType)}
                                                    >{displayed.replace(/_/g, ' ')}
                                                    </Checkbox>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                </Modal>

                            }
                        </div>
                        <div className="data-col">
                            <div className="data-name">Sensors Active</div>
                            <div className="data-value">{activeSensorQuantity}</div>
                        </div>
                        <div className="data-col">
                            <div className="data-name">Battery Strength</div>
                            <div className="data-value">{batteryPower}</div>
                        </div>
                        { selectedModule && selectedModule.split(':')[0] === '0101' &&
                        <div className="data-col">
                            <div className="data-name">Sensing Interval</div>
                            <div className="sensing">
                                {renderSensingIntervalOptions(selectedSensorModuleObj)}
                            </div>
                        </div>
                        }
                        <div className="data-col">
                            <div className="data-name col-dropdown">Graph Timespan</div>
                            {renderGraphTimespanToggle()}
                        </div>
                    </div>
                    
                    <div
                        className="sensor-graph-container"
                    >
                        { sensorTypes ?
                            sensorTypes.map((sensor: any, index: any) => {
                            return (
                                <div 
                                    className="sensor-container"
                                    key={sensor.seriesID}
                                > 
                                    <div className="unit-rt-container">
                                        <div className="header">
                                            {sensor.type.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        { activeSensors && sensorTypes ?
                                        <Fragment>
                                            <div className="unit-value">
                                                {
                                                activeSensors[index] &&
                                                activeSensors[index].type === sensor.type && 
                                                activeSensors[index].rtValue ?
                                                    activeSensors[index].type === 'pressure' ?
                                                    activeSensors[index].rtValue.toFixed(1) :
                                                    activeSensors[index].rtValue.toFixed(2) :
                                                    <img src={loader} />
                                                }
                                                <span className="unit">{sensorTypes[index] && 
                                                    sensorTypes[index].unit}</span>
                                            </div>
                                            { sensorTypes[index] &&
                                            <div className="graph-info-container">
                                                <div className="sensor-insight">
                                                    Maximum: <strong>{sensorTypes[index].maxVal}</strong></div>
                                                <div className="sensor-insight">
                                                    Minimum: <strong>{sensorTypes[index].minVal}</strong></div>
                                                <div className="sensor-insight">
                                                    Average: <strong>{sensorTypes[index].avgVal}</strong></div>
                                            </div>
                                            }
                                        </Fragment>
                                        :
                                        <img src={loader} />
                                        }
                                    </div>
                                    { sensorTypes && sensorTypes[index] && TSDBDataFetched ?
                                    <Fragment>
                                        <div className="graph-container">
                                            <AmChart
                                                TSDB={sensorTypes[index]}
                                                newWebsocketData={(value: boolean) => setNewWebsocketData(value)}
                                                identifier={sensorTypes[index].type}
                                                timespanNumeric={graphTimespanNumeric}
                                                timespan={graphTimespan}
                                            />
                                        </div> 
                                    </Fragment>
                                    :
                                    <div className="graph-container">
                                    <img src={loader} />
                                    </div>
                                    }
                                </div>
                            );
                        }) :
                        <div className="sensor-data-loader">
                            <img src={loader} />
                        </div>
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    );
};

export default SensorModule;