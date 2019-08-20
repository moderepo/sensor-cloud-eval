import React, { useEffect, useState, Fragment, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { Context, context } from '../context/Context';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import moment from 'moment';
import { Menu, Dropdown, Icon, Checkbox, Modal, Input } from 'antd';
import ModeConnection  from '../controllers/ModeConnection';
import determinUnit from '../utils/SensorTypes';

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
const fullALPsList = ['TEMPERATURE:0', 'HUMIDITY:0', 'UV:0', 'PRESSURE:0', 'AMBIENT:0', 
    'MAGNETIC_X:0', 'ACCELERATION_Y:0', 'ACCELERATION_Z:0', 'MAGNETIC_Y:0', 
    'MAGNETIC_Z:0', 'ACCELERATION_X:0'];
const MODE_API_BASE_URL = 'https://api.tinkermode.com/';

interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps) => {
    const [selectedModule, setSelectedModule] = useState<string|null>();
    const [sensorModuleName, setSensorModuleName] = useState<string>();
    const [selectedGateway, setSelectedGateway] = useState<string|null>();
    const [TSDBDataFetched, setTSDBDataFetched] = useState<boolean>(false);
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(0);
    const [activeSensors, setActiveSensors] = useState<any>(); // contains RT Websocket data
    const [newWebsocketData, setNewWebsocketData] = useState<boolean>(false);
    const [sensorTypes, setSensorTypes] = useState<Array<any>>(); // contains data from TSDB fetch
    const [batteryPower, setBatteryPower] = useState<number>(0.1);
    const [sensingInterval, setSensingInterval] = useState<string>('2s');
    const [graphTimespanNumeric, setGraphTimespanNumeric] = useState<any>(7);
    const [graphTimespan, setGraphTimespan] = useState<string>('days');
    const [fullSensorList, setFullSensorList] = useState();
    const [offlineSensors, setOfflineSensors] = useState<Array<any>>([]);
    const [mounted, setMounted] = useState(false);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [moduleSettingsVisible, setModuleSettingsVisible] = useState<boolean>(false);
    const [editingModuleSettings, setEditingModuleSettings] = useState(false);
    const sensorContext: Context = useContext(context);
    
    const performTSDBFetch =  
    (homeID: string, sensors: any, 
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
        // set fetch url
        const fetchURL = 
        MODE_API_BASE_URL + 'homes/' + homeID + '/smartModules/tsdb/timeSeries/' + seriesID
        + '/data?begin=' + startTime.toISOString() + '&end=' + endTime.toISOString() 
        + '&aggregation=avg';
        // perform fetch
        modeAPI.request('GET', fetchURL, {})
        .then((response: any) => {
            let maxVal = 0;
            let minVal = Infinity;
            let sum = 0;
            // for each set of TSDB data, perform a calculation
            response.data.data.forEach((datapoint: any, datapointIndex: any) => {
                sum += datapoint[1];
                if (datapoint[1] > maxVal) {
                    maxVal = datapoint[1];
                }
                if (datapoint[1] < minVal) {
                    minVal = datapoint[1];
                }
                if (datapointIndex === response.data.data.length - 1) {
                    const sensorData = {
                        seriesID: seriesID,
                        unit: unit,
                        type: sType,
                        TSDBData: response.data,
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
                        const sortedTSDBData = sensors.sort(function(a: any, b: any) {
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
    // React hook's componentDidMount and componentDidUpdate
    useEffect(
        () => {
            // set home id
            let homeID = '';
            modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
            .then((response: any) => {
                homeID = response.id;
            });
            // restore login
            AppContext.restoreLogin();
            setMounted(true);
            // get selected device and module
            const gateway = sessionStorage.getItem('selectedGateway');
            const sensorModule = sessionStorage.getItem('selectedModule');
            setSelectedModule(sensorModule);
            setSelectedGateway(gateway);
            if (gateway !== null) {
                setTimeout(
                    () => {
                        // list sensor modules
                        ModeConnection.listSensorModules(gateway);
                    },
                    1000
                );
            }
            if (sensorModule) {
                // for now, setting sensor module name to ID
                setSensorModuleName(sensorModule);
                // fetch module data from KV store
                const deviceURL = MODE_API_BASE_URL + 'devices/' + gateway + '/kv/sensorModule' + sensorModule;
                modeAPI.request('GET', deviceURL, {})
                .then((response: any) => {                    
                    const moduleSensors = response.data.value.sensors;
                    // set name of sensor
                    setSensorModuleName(response.data.value.name);
                    // set full sensor list and quantity
                    setFullSensorList(moduleSensors);
                    setActiveSensorQuantity(moduleSensors.length);
                    // determine offline sensors
                    let sensorsOffline: any = fullALPsList.filter((sensor: any, index: any): boolean => {
                        return !response.data.value.sensors.includes(sensor);
                    });
                    setOfflineSensors(sensorsOffline);
                    // getTSDB seriesID for the particular module 
                    const TSDBURL = MODE_API_BASE_URL + 'homes/' + homeID + '/smartModules/tsdb/timeSeries';
                    modeAPI.request('GET', TSDBURL, {})
                    .then((tsdbResponse: any) => {  
                        // filter response initially by selected module
                        let filteredTSDBData: any = tsdbResponse.data.filter((tsdbData: any): boolean => {
                            return tsdbData.id.includes(selectedModule);
                        });
                        // filter again for online sensors
                        let onlineTSDBData: any = filteredTSDBData.filter((filteredData: any): boolean => {
                            const sensorType = filteredData.id.split('-')[1].toUpperCase();
                            return moduleSensors.includes(sensorType) && 
                            !sensorType.includes('ACCELERATION') && !sensorType.includes('MAGNETIC');
                        });
                        let sensors: any = [];
                        // for online sensors, perform TSDB fetch
                        onlineTSDBData.forEach((sensor: any, index: any) => {
                            if (onlineTSDBData.length > 0 && !TSDBDataFetched) {
                                const format = sensor.id.split('-')[1];
                                const sType = format.split(':')[0];
                                const unit = determinUnit(sType);
                                if (unit !== undefined) {
                                    performTSDBFetch(homeID, sensors, sType, sensor.id, unit, onlineTSDBData);
                                }
                            }
                        });
                    });
                });
            }
            // websocket message handler for RT data
            const webSocketMessageHandler: any = {
                notify: (message: any): void => {
                    const moduleData = message;
                    // if event is sensorModuleList, set fullSensorList
                    if (moduleData.eventType === 'sensorModuleList') {
                        if (selectedModule && moduleData.eventData.sensorModules[selectedModule]) {
                            const sensorList = moduleData.eventData.sensorModules[selectedModule].sensors;
                            setFullSensorList(sensorList);
                        }
                    }
                    // if app receives real time data, and it pertains to the selected Module:
                    if (homeID && moduleData.eventType === 'realtimeData' 
                    && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule) &&
                    !moduleData.eventData.timeSeriesData[0].seriesId.includes('magnetic')) {
                        const wsData = moduleData.eventData.timeSeriesData;
                        let rtData: any = [];
                        let rtNumbers: any = [];
                        wsData.forEach((sensor: any, index: any) => {
                            const format = sensor.seriesId.split('-')[1];
                            // IMPORTANT: if user is choosing to view data from this sensor:
                            if (!offlineSensors.includes(format.toUpperCase())) {
                                const sType = format.split(':')[0];
                                let unit = determinUnit(sType);
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
                                    const sortedRTData = rtData.sort(function(a: any, b: any) {
                                        if (a.type < b.type) {
                                            return -1;
                                        }
                                        if (a.type > b.type) {
                                            return 1;
                                        }
                                        return 0;
                                    });
                                    sensorContext.actions.setRTValues(rtNumbers);                        
                                    setActiveSensors(sortedRTData); // set real time data
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
    },  [editingModuleSettings, selectedGateway, selectedModule, TSDBDataFetched, graphTimespan, graphTimespanNumeric]);

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
        const device = sessionStorage.getItem('selectedGateway');
        if (device && sensorModule) {
            const params = {
                value: {
                    name: sensorModuleName,
                    gatewayID: device, 
                    id: sensorModule,
                    interval: 30,
                    modelId: '0101',
                    sensing: 'on',
                    sensors: filteredActiveSensors
                }
            };
            // // update KV store for device + module
            const deviceURL = MODE_API_BASE_URL + 'devices/' + device + '/kv/sensorModule' + sensorModule;
            modeAPI.request('PUT', deviceURL, params)
            .then((deviceResponse: any) => {
                return deviceResponse;
            }).catch((reason: any) => {
                console.error('reason', reason);
            });
            // update KV store for home + module
            modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
            .then((response: any) => {
                const homeURL = MODE_API_BASE_URL + 
                    'homes/' + response.id + '/kv/sensorModule' + sensorModule;
                modeAPI.request('PUT', homeURL, params)
                .then((homeResponse: any) => {
                    setEditingModuleSettings(true);
                    return homeResponse;
                }).catch((reason: any) => {
                    console.error('reason', reason);
                });
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
        AppContext.restoreLogin();
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            const homeID = response.id;
            setGraphTimespanNumeric(quantity);
            setGraphTimespan(timespan);
            if (sensorTypes !== undefined) {
                // map through active sensors and perform fetch
                sensorTypes.map((sensor: any, index: any) => {
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
                <a className="default-timespan-value">
                    {`${graphTimespanNumeric} ${graphTimespan}`}
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
                            <div className="data-value">{sensingInterval}</div>
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
                                            {sensor.type.toUpperCase()}
                                        </div>
                                        { activeSensors && sensorTypes ?
                                        <Fragment>
                                            <div className="unit-value">
                                                {sensorTypes[index] ?
                                                    sensor.type === 'pressure' ?
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
