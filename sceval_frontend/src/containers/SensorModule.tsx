import React, { useEffect, useState, Fragment, useContext } from 'react';
import { NavLink, withRouter, RouteComponentProps } from 'react-router-dom';
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
import { SensorModuleInterface, SensingInterval } from '../components/entities/SensorModule';
import { Constants } from '../utils/Constants';
import { Home } from '../components/entities/API';
import { RouteParams } from '../components/entities/Routes';

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
// declare the SensorModuleProps interface
interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

export const SensorModule = withRouter((props: SensorModuleProps & RouteComponentProps<RouteParams>) => {
    // homeId state
    const [homeId, setHomeId] = useState<number>(0);
    // selected module state
    const [selectedModule, setSelectedModule] = useState<string|null>();
    // sensor module name state
    const [sensorModuleName, setSensorModuleName] = useState<string>();
    // sensor module data object state
    const [selectedSensorModuleObj, setSelectedSensorModuleObj] = useState<SensorModuleInterface|null>();
    // selected gateway state
    const [selectedGateway, setSelectedGateway] = useState<number>(0);
    // state of all TSDB data being fetched
    const [TSDBDataFetched, setTSDBDataFetched] = useState<boolean>(false);
    // quantity of active sensors
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(0);
    // contains RT Websocket data
    const [activeSensors, setActiveSensors] = useState<any>();
    // contains data from TSDB fetch
    const [sensorTypes, setSensorTypes] = useState<Array<any>>();
    // default 15 unit time horizon
    const [graphTimespanNumeric, setGraphTimespanNumeric] = useState<any>(15);
    // default minute time horizon
    const [graphTimespan, setGraphTimespan] = useState<string>('minutes');
    // full sensor list associated to sensor module
    const [fullSensorList, setFullSensorList] = useState();
    // list of sensors offline
    const [offlineSensors, setOfflineSensors] = useState<Array<any>>([]);
    // settings modal display state
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    // module settings visible state (dropdown)
    const [moduleSettingsVisible, setModuleSettingsVisible] = useState<boolean>(false);
    // editing sensor module settings state
    const [editingModuleSettings, setEditingModuleSettings] = useState<boolean>(false);
    // empty time-series data returned state
    const [noTSDBData, setNoTSDBData] = useState<boolean>(false);
    // declaration of a useContext hook
    const sensorContext: Context = useContext(context);

    // to keep track of component mounted/unmounted event so we don't call set state when component is unmounted
    let componentUnmounted: boolean;

    // time-series data fetch handler method
    const performTSDBFetch =  
    (homeID: number, sensors: any, 
     sType: string, seriesID: string, unit: string, wsData: any ) => {
        // set now as reference point
        const now = new Date();
        const endTime = moment(now);
        // determine start time
        const startTime = moment(now).subtract(
            graphTimespanNumeric === '' ?
                1 : graphTimespanNumeric, 
            graphTimespan === 'real-time' ?
                'minute' : graphTimespan);
        // get time-series data for the provided time-range and series type
        modeAPI.getTSDBData(homeID, seriesID, startTime.toISOString(), endTime.toISOString())
        .then((timeseriesData: TimeSeriesData) => {
            if (componentUnmounted) {
                return;
            }
            let maxVal = 0;
            let minVal = Infinity;
            let sum = 0;
            // if data exists
            if (timeseriesData.data.length > 0) {
                // for each set of TSDB data, perform a calculation
                timeseriesData.data.forEach((datapoint: any, datapointIndex: any) => {
                    // add to total data points
                    sum += datapoint[1];
                    // check for maximum
                    if (datapoint[1] > maxVal) {
                        maxVal = datapoint[1];
                    }
                    // check for minimum
                    if (datapoint[1] < minVal) {
                        minVal = datapoint[1];
                    }
                    // if all data points have been assessed
                    if (datapointIndex === timeseriesData.data.length - 1) {
                        // push the updated data into a sensordata object
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
                        // push that data to the sensors array
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
            }
        });
    };

    /**
     * This useEffect does not depend on any state so it will only get called once, when the component is mounted
     */
    useEffect(
        () => {
            // run this code in an async function to make sure these are ran in this order.
            (async () => {
                // restore login
                AppContext.restoreLogin();
    
                // open new connection for refresh
                ModeConnection.openConnection(); 

                // get home id
                const home: Home = await modeAPI.getHome(ClientStorage.getItem('user-login').user.id);
    
                if (!componentUnmounted) {
                    setHomeId(home.id);

                    // get selected device and module
                    if (props.match.params.sensorModuleId) {
                        const sensorModule = props.match.params.sensorModuleId;
                        setSelectedModule(props.match.params.sensorModuleId);
                    }
                    if (props.match.params.deviceId) {
                        const gateway = props.match.params.deviceId;
                        setSelectedGateway(parseInt(gateway, 10));
                    }
                }
            })();
    },  []);

    // React hook's componentDidMount and componentDidUpdate
    useEffect(
        () => {
            componentUnmounted = false;

            if (homeId !== 0 && selectedGateway && selectedModule) {

                // fetch module data from KV store
                modeAPI.getDeviceKeyValueStore(
                    selectedGateway, `${Constants.SENSOR_MODULE_KEY_PREFIX}${selectedModule}`
                ).then((keyValueStore: KeyValueStore) => {
                    if (componentUnmounted) {
                        return;
                    }

                    setSelectedSensorModuleObj(keyValueStore);
                    
                    const moduleSensors = keyValueStore.value.sensors;
                    // set name of sensor
                    setSensorModuleName(keyValueStore.value.name);
                    // set full sensor list and quantity
                    setFullSensorList(moduleSensors);
                    setActiveSensorQuantity(moduleSensors.length);
                    // determine offline sensors
                    let sensorsOffline: any = Constants.ALPS_SENSOR_SET.filter((sensor: any): boolean => {
                        return !keyValueStore.value.sensors.includes(sensor);
                    });
                    setOfflineSensors(sensorsOffline);

                    modeAPI.getTSDBInfo(homeId).then((tsdbInfo: TimeSeriesInfo[]) => {
                            if (componentUnmounted) {
                                return;
                            }
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
                // catch any errors in sensor module settings fetch
                }).catch((error: ErrorResponse): void => {
                    alert(`Unable to get sensor module settings because of this error '${error.message}'`);
                    console.log(error);
                });
            }

            // websocket message handler for RT data
            const webSocketMessageHandler: any = {
                notify: (message: any): void => {
                    if (componentUnmounted) {
                        return;
                    }
                    const moduleData = message;
                    // if app receives real time data, and it pertains to the selected Module:
                    if (homeId && moduleData.eventType === Constants.EVENT_REALTIME_DATA
                    && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule)) {
                        const wsData = moduleData.eventData.timeSeriesData;
                        let rtData: any = [];
                        let rtNumbers: any = [];
                        // for each sensor returned in the event:
                        wsData.forEach((sensor: any, index: any) => {
                            const format = sensor.seriesId.split('-')[1];
                            // if the sensor is online:
                            if (!offlineSensors.includes(format.toUpperCase())) {
                                const sType = format.split(':')[0];
                                // update the rtData object
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
                                // if we have gone through all RT data:
                                if (index === wsData.length - 1) {
                                    // if activeSensors already exists:
                                    if (activeSensors) {
                                        let updatedActiveArray: any = activeSensors;
                                        rtData.forEach((newSensor: any) => {
                                            // filter and check if RT data for the online sensor exists
                                            const dataExists = activeSensors.filter((onlineSensor: any): boolean => {
                                                return onlineSensor.type === newSensor.type;
                                            });
                                            // if the sensor already has previous RT data, update it
                                            if (dataExists.length === 1) {
                                                updatedActiveArray.forEach((updatedSensor: any) => {
                                                    if (updatedSensor.type === newSensor.type) {
                                                        updatedSensor.rtValue = newSensor.rtValue;
                                                    }
                                                });
                                            // otherwise just simply push to new array and update
                                            } else {
                                                updatedActiveArray.push(newSensor);
                                            }
                                        });
                                        // after loop finishes, set active sensors to updated data set 
                                        setActiveSensors(updatedActiveArray.sort((a: any, b: any) => {
                                            if (a.type < b.type) {
                                                return -1;
                                            }
                                            if (a.type > b.type) {
                                                return 1;
                                            }
                                            return 0;
                                        })); 
                                    // if this is the first RT data event, just simply sort and push data set
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
                                        setActiveSensors(sortedSensors); // set real time data
                                    }
                                    // set global RT values for AmCharts
                                    sensorContext.actions.setRTValues(rtNumbers);   
                                }
                            }
                        });
                    }
                }
            };
            // check to see that TSDB data was fetched and set flag accordingly
            if (sensorTypes && sensorTypes.length > 0) {
                setNoTSDBData(false);
            } else {
                setNoTSDBData(true);
            }
            ModeConnection.addObserver(webSocketMessageHandler);
            // Return cleanup function to be called when the component is unmounted
            return (): void => {
                componentUnmounted = true;
                ModeConnection.removeObserver(webSocketMessageHandler);
            };
    // method invoke dependencies
    },  [homeId, activeSensors, editingModuleSettings, selectedGateway, 
        selectedModule, TSDBDataFetched, graphTimespan, graphTimespanNumeric]);
    // toggle modal visibility handler
    const toggleModalVisibility = () => {
        if (modalVisible) {
            setModuleSettingsVisible(false);
        }
        setModalVisible(!modalVisible);
    };
    // handler for renaming of the current sensor module
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setSensorModuleName(event.target.value);
    };
    // handler for the submission of new sensor module settings changes  
    const handleOk = (event: any) => {
        let filteredActiveSensors: any = Constants.ALPS_SENSOR_SET.filter((sensor: any): boolean => {
            // if the user does not request the sensor to be turned off
            return !offlineSensors.includes(sensor);
        });
        // perform kv updates
        if (props.match.params.deviceId) {
            const gateway = props.match.params.deviceId;
            // copy the current selected sensor module object and replace the module's name and list of sensors
            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, selectedSensorModuleObj);
            if (sensorModuleName) {
                updatedSensorModuleObj.value.name = sensorModuleName;
            }
            updatedSensorModuleObj.value.sensors = filteredActiveSensors;

            // update KV store for the device
            modeAPI.setDeviceKeyValueStore(parseInt(gateway, 10), updatedSensorModuleObj.key, updatedSensorModuleObj)
            .then((deviceResponse: any) => {
                if (componentUnmounted) {
                    return;
                }
                setEditingModuleSettings(true);
                return deviceResponse;
            }).catch((reason: any) => {
                console.error('reason', reason);
            });
            // re-render changes
            setEditingModuleSettings(false);
            // hide module settings
            setModuleSettingsVisible(false);
            // hide modal
            setModalVisible(false);
        }
    };
    // adjusting offline sensors handler
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
    // handler for toggling sensor module settings dropdown
    const toggleSensorModuleSettingsVisible = () => {
        setModuleSettingsVisible(!moduleSettingsVisible);
    };
    // handler for toggling the graph timespan dropdown
    const toggleGraphTimespan = (quantity: number, timespan: string): void => {
        let sensorSet: any = [];
        // set TSDB data flag to false
        setTSDBDataFetched(false);
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            if (componentUnmounted) {
                return;
            }

            const homeID = response.id;
            // update the UI according to the new timespan
            if (sensorTypes !== undefined) {
                // map through active sensors and perform fetch
                sensorTypes.forEach((sensor: any, index: any) => {
                    performTSDBFetch(
                    homeID, sensorSet, sensor.type, sensor.seriesID,
                    sensorTypes[index].unit, sensorTypes);
                });
            }
        });
        // update the UI according to the new timeframe and quantity
        setGraphTimespanNumeric(quantity);
        setGraphTimespan(timespan);
    };
    // render helper for graph timespan menu
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
    // sensing interval helper method for changing timeframe of receving real-time data
    const setSensingInterval = 
        (sensorModuleObj: SensorModuleInterface | null | undefined, interval: SensingInterval): void => {
        if (selectedGateway && sensorModuleObj && interval && interval.value > 0 &&
            sensorModuleObj.value.interval !== (interval.value * interval.multiplier)) {

            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, sensorModuleObj);
            updatedSensorModuleObj.value.interval = interval.value * interval.multiplier;
            modeAPI.setDeviceKeyValueStore(selectedGateway, sensorModuleObj.key, updatedSensorModuleObj).then(
                (status: number): void => {
                if (componentUnmounted) {
                    return;
                }

                // now update the state
                setSelectedSensorModuleObj(updatedSensorModuleObj);
            },  (error: any): void => {
                alert('Unable to update device key value store');
                console.log('Unable to update device key value store', error);
            });
        }
    };
    // render helper for sensing interval menu
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
                                // if the module settings are visible:
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
                                // if the modal state is visible:
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
                                            // if the the active sensors have been fetched:
                                            Constants.ALPS_SENSOR_SET.map((sensorType: any, index: any)  => {
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
                            // if TSDB data exists for the active sensors:
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
                                        // render loader
                                        <img src={loader} />
                                        }
                                    </div>
                                    { sensorTypes && sensorTypes[index] && TSDBDataFetched ?
                                    // if TSDB data for particular sensor exists:
                                    <Fragment>
                                        <div className="graph-container">
                                            <AmChart
                                                TSDB={sensorTypes[index]}
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
                        // if the response is not empty
                        !noTSDBData ?
                        <div className="sensor-data-loader">
                            <img src={loader} />
                        </div> :
                        // if the TSDB data for the timeframe is actually empty
                        <div className="sensor-data-loader">
                            No Data Available For This Timeframe
                        </div>
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    );
});

export default SensorModule;