import React, { useEffect, useState, useContext, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { ContextConsumer, Context, ContextProvider } from '../context/Context';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import moment from 'moment';
import { math } from '@amcharts/amcharts4/core';

const loader = require('../common_images/notifications/loading_ring.svg');
const enySensor = require('../common_images/sensors/eny-sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
const MODE_API_BASE_URL = 'https://api.tinkermode.com/';

interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

interface RealTimeData {

}

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps) => {
    const [selectedModule, setSelectedModule] = useState<string|null>();
    const [selectedGateway, setSelectedGateway] = useState<string|null>();
    const [TSDBDataFetched, setTSDBDataFetched] = useState<boolean>(false);
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(5);
    const [activeSensors, setactiveSensors] = useState<any>(); // contains RT Websocket data
    const [sensorTypes, setSensorTypes] = useState<Array<any>>(); // contains data from TSDB fetch
    const [batteryPower, setBatteryPower] = useState<number>(0.1);
    const [sensingInterval, setSensingInterval] = useState<string>('');
    const [graphTimespan, setGraphTimespan] = useState<string>('hour');
    const [mounted, setMounted] = useState(false);

    useEffect(
        () => {
            AppContext.restoreLogin();
            setMounted(true);
            setSelectedModule(sessionStorage.getItem('selectedModule'));
            setSelectedGateway(sessionStorage.getItem('selectedGateway'));

    },  []);

    const determineUnit = (sensorType: string) => {
        switch (sensorType) {
            case 'pressure':
                return 'hPa'; 
            case 'temperature':
                return '°C';
            case 'humidity':
                return '%';
            case 'ambient':
                return 'Lx';
            case 'uv':
                return 'mW/cm²';
            case 'sound':
                return 'dB';
            case 'omron_discomfort':
                return '';
            case 'omron_heatstroke':
                return '';
            default:
                return;
        }
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
            // if app receives real time data, and it pertains to the selected Module:
            if (moduleData.eventType === 'realtimeData' 
            && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule) &&
            !moduleData.eventData.timeSeriesData[3].seriesId.includes('acceleration')) {
                let sensors: any = [];
                const wsData = moduleData.eventData.timeSeriesData;
                let rtData: any = [];
                setActiveSensorQuantity(wsData.length); // set active sensor count
                wsData.forEach((sensor: any, index: any) => {
                    const format = sensor.seriesId.split('-')[1];
                    const sType = format.split(':')[0];
                    let unit = determineUnit(sType);
                    rtData.push({
                        seriesID: sensor.seriesId,
                        type: sType,
                        timestamp: sensor.timestamp,
                        rtValue: sensor.value
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
                        setactiveSensors(sortedRTData); // set real time data
                        
                    }
                    if (!TSDBDataFetched) { // if not all TSDB data has been fetched:
                    // Perform TSDB fetch for each sensor
                        const now = new Date();
                        const endTime = moment(now);
                        const startTime = moment(now).subtract(10, 'days');
                        const fetchURL = 
                        MODE_API_BASE_URL + 'homes/' + homeID + '/smartModules/tsdb/timeSeries/' + sensor.seriesId
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
                            });
                        // Add relevant UI formatted units
                        // bundle data
                            if (sensors.length === wsData.length) { // if all of the sensor data has been populated
                                const sortedTSDBData = sensors.sort(function(a: any, b: any) {
                                    if (a.type < b.type) {
                                        return -1;
                                    }
                                    if (a.type > b.type) {
                                        return 1;
                                    }
                                    return 0;
                                });
                                setSensorTypes(sortedTSDBData);
                                setTSDBDataFetched(true);
                            }
                        });
                    }
                });
            }
        };
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
                            <img src={enySensor} />
                            <div className="info-section">
                                <div className="device-name">{selectedModule}</div>
                                <div className="gateway-name">Gateway name: {selectedGateway}</div>
                                <div className="sensor-model">Sensor model: {selectedModule} </div>
                            </div>
                            <button>•••</button>
                        </div>
                        <div className="data-col">
                            <div className="data-name">Sensors Active</div>
                            <div className="data-value">{activeSensorQuantity}</div>
                        </div>
                        <div className="data-col">
                            <div className="data-name">Battery</div>
                            <div className="data-value">{batteryPower}</div>
                        </div>
                        <div className="data-col">
                            <div className="data-name">Sensing Interval</div>
                            <div className="data-value">{sensingInterval}</div>
                        </div>
                    </div>
                    
                    <div
                        className="sensor-graph-container"
                    >
                        { activeSensors &&
                            activeSensors.map((activeSensor: any, index: any) => {
                            return (
                                <div 
                                    className="sensor-container"
                                    key={activeSensor.seriesID}
                                > 
                                    <div className="unit-rt-container">
                                        <div className="header">
                                            {activeSensor.type}
                                        </div>
                                        { activeSensors && sensorTypes ?
                                        <div className="unit-value">
                                            {TSDBDataFetched && 
                                                activeSensors[index].rtValue.toFixed(1)}
                                        <span className="unit">{sensorTypes[index] && sensorTypes[index].unit}</span>
                                        </div> :
                                        <img src={loader} />
                                        }
                                    </div>
                                    { sensorTypes ?
                                    <Fragment>
                                        <div className="graph-container">
                                            <AmChart
                                                sensorData={sensorTypes[index]}
                                                identifier={sensorTypes[index].type}
                                            />
                                        </div> 
                                        <div className="graph-info-container">
                                            <div>Maximum: <strong>{sensorTypes[index].maxVal}</strong></div>
                                            <div>Minimum: <strong>{sensorTypes[index].minVal}</strong></div>
                                            <div>Average: <strong>{sensorTypes[index].avgVal}</strong></div>
                                        </div>
                                    </Fragment>
                                    :
                                    <div className="graph-container">
                                    <img src={loader} />
                                    </div>
                                    }
                                </div>
                            );
                        })
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
