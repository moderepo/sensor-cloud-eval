import React, { useEffect, useState, useContext, Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { ContextConsumer, Context, ContextProvider } from '../context/Context';

const enySensor = require('../common_images/sensors/eny-sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

interface RealTimeData {

}

const selectedModule = sessionStorage.getItem('selectedModule');
const selectedGateway = sessionStorage.getItem('selectedGateway');

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps) => {
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(5);
    const [activeSensors, setactiveSensors] = useState<any>();
    const [sensorTypes, setSensorTypes] = useState<Array<any>>();
    const [batteryPower, setBatteryPower] = useState<number>(0.1);
    const [sensingInterval, setSensingInterval] = useState<string>('5 secs');
    const [graphTimespan, setGraphTimespan] = useState<string>('hour');
    const [mounted, setMounted] = useState(false);

    useEffect(
        () => {
            AppContext.restoreLogin();
            setMounted(true);
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
        const ws = context.state.webSocket;
        ws.onmessage = function(event: any) {
            const moduleData = JSON.parse(event.data);
            // if app receives real time data, and it pertains to the selected Module:
            if (moduleData.eventType === 'realtimeData' 
            && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule) &&
            !moduleData.eventData.timeSeriesData[3].seriesId.includes('acceleration')) {
                console.log(moduleData.eventData.timeSeriesData);
                let sensors: any = [];
                setactiveSensors(moduleData.eventData.timeSeriesData);
                setActiveSensorQuantity(moduleData.eventData.timeSeriesData.length);
                moduleData.eventData.timeSeriesData.forEach((sensor: any, index: any) => {
                    const format = sensor.seriesId.split('-')[1];
                    const sType = format.split(':')[0];
                    let unit = determineUnit(sType);
                    const sensorData = {
                        unit: unit,
                        type: sType
                    };
                    sensors.push(sensorData);
                    if (index === moduleData.eventData.timeSeriesData.length - 1) {
                        setSensorTypes(sensors);
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
                        <div className="data-col">
                            <div className="data-name">Graph Timespan</div>
                            <div className="data-value">{`${graphTimespan}`}</div>
                        </div>
                    </div>
                    
                    <div
                        className="sensor-graph-container"
                    >
                        { activeSensors && sensorTypes &&
                            activeSensors.map((activeSensor: any, index: any) => {
                            return (
                                <div 
                                    className="sensor-container"
                                    key={activeSensor.seriesId}
                                >
                                    <div className="unit-rt-container">
                                        <div className="header">
                                            {sensorTypes[index].type}
                                        </div>
                                        <div className="unit-value">
                                            {activeSensor.value.toFixed(1)}
                                        <span className="unit">{sensorTypes[index].unit}</span>
                                        </div>
                                    </div>
                                    <div className="graph-container">
                                        <AmChart />
                                    </div>
                                    <div className="graph-info-container">
                                        <div>{`Maximum: `}</div>
                                        <div>{`Minimum: `}</div>
                                        <div>{`Average: `}</div>
                                    </div>
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
