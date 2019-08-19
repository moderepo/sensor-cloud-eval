import React, { useEffect, useState, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { ContextConsumer, Context } from '../context/Context';
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

    useEffect(
        () => {
            AppContext.restoreLogin();
            setMounted(true);
            const gateway = sessionStorage.getItem('selectedGateway');
            const sensorModule = sessionStorage.getItem('selectedModule');
            setSelectedModule(sensorModule);
            setSelectedGateway(gateway);
            if (gateway !== null) {
                setTimeout(
                    () => {
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
                    let sensorsOffline: any = [];
                    fullALPsList.map((sensor: any, index: any) => {
                        if (!response.data.value.sensors.includes(sensor)) {
                            sensorsOffline.push(sensor);
                        }
                        if (index === fullALPsList.length - 1) {
                            setOfflineSensors(sensorsOffline);
                        }
                    });
                });
            }
    },  [editingModuleSettings]);

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
        let filteredActiveSensors: any = [];
        // go through all sensors that are currently connected
        fullALPsList.map((sensor: any, index: any) => {
            // if the user does not request the sensor to be turned off
            if (!offlineSensors.includes(sensor)) {
                // keep online and push to filtered sensors
                filteredActiveSensors.push(sensor);
            }
            // once through full list
            if (index === fullSensorList.length - 1) {
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
                    // update KV store for device + module
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
            }
        });
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

    const performTSDBFetch =  
    (homeID: string, sensors: any, sensor: any, 
     sType: string, seriesID: string, unit: string, wsData: any ) => {
        const now = new Date();
        const endTime = moment(now);
        const startTime = moment(now).subtract(
            graphTimespanNumeric === '' ?
                1 : graphTimespanNumeric, 
            graphTimespan === 'real-time' ?
                'minute' : graphTimespan);
        const fetchURL = 
        MODE_API_BASE_URL + 'homes/' + homeID + '/smartModules/tsdb/timeSeries/' + seriesID
        + '/data?begin=' + startTime.toISOString() + '&end=' + endTime.toISOString() 
        + '&aggregation=avg';
        modeAPI.request('GET', fetchURL, {})
        .then((response: any) => {
            let maxVal = 0;
            let minVal = Infinity;
            let sum = 0;
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
                        seriesID: sensor.seriesId,
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
                    sensors.push(sensorData);
                }
                // Add relevant UI formatted units
                // bundle data
                if (sensors.length === wsData.length) { 
                // if all of the sensor data has been populated
                    const sortedTSDBData = sensors.sort(function(a: any, b: any) {
                        if (a.type < b.type) {
                            return -1;
                        }
                        if (a.type > b.type) {
                            return 1;
                        }
                        return 0;
                    });
                    if (!TSDBDataFetched) {
                        setSensorTypes(sortedTSDBData);
                        setTSDBDataFetched(true);
                    }
                }
            });
        });
    };

    const updateModuleData = (context: Context) => {
        let homeID = '';
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            homeID = response.id;
        });
        const ws = context.state.webSocket;
        ws.onmessage = (event: any) => { // receives every 5 seconds
            const moduleData = JSON.parse(event.data);
            setNewWebsocketData(true);
            if (moduleData.eventType === 'sensorModuleList') {
                if (selectedModule && moduleData.eventData.sensorModules[selectedModule]) {
                    const sensorList = moduleData.eventData.sensorModules[selectedModule].sensors;
                    setFullSensorList(sensorList);
                }
            }
            // if app receives real time data, and it pertains to the selected Module:
            if (moduleData.eventType === 'realtimeData' 
            && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule) &&
            !moduleData.eventData.timeSeriesData[0].seriesId.includes('magnetic')) {

                const wsData = moduleData.eventData.timeSeriesData;
                let sensors: any = [];
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
                            context.actions.setRTValues(rtNumbers);                        
                            setActiveSensors(sortedRTData); // set real time data
                            
                        }
                        if (!TSDBDataFetched) { // if not all TSDB data has been fetched:
                            // Perform TSDB fetch for each sensor
                            if (unit !== undefined) {
                                performTSDBFetch(homeID, sensors, sensor, sType, sensor.seriesId, unit, wsData);
                            }
                        }
                    }
                });
            }
        };
    };

    const toggleGraphTimespan = (quantity: number, timespan: string): void => {
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
                activeSensors.map((sensor: any, index: any) => {
                    performTSDBFetch(
                    homeID, [], sensor, sensor.type, sensor.seriesID,
                    sensorTypes[index].unit, activeSensors);
                });
            }
        });
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
        <ContextConsumer>
        {(context: Context) =>
          context && (
        <Fragment>
            {
                mounted && context.state.webSocket && 
                    updateModuleData(context)
            }
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
                            <div className="data-name">Battery</div>
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
                        { activeSensors ?
                            activeSensors.map((activeSensor: any, index: any) => {
                            return (
                                <div 
                                    className="sensor-container"
                                    key={activeSensor.seriesID}
                                > 
                                    <div className="unit-rt-container">
                                        <div className="header">
                                            {activeSensor.type.toUpperCase()}
                                        </div>
                                        { activeSensors && sensorTypes ?
                                        <Fragment>
                                            <div className="unit-value">
                                                {activeSensors[index] ?
                                                    activeSensors[index].rtValue.toFixed(1) :
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
                                                websocketRT={activeSensors[index]}
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
        )
    }
    </ContextConsumer>
    );
};

export default SensorModule;
