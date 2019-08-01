import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import ModeConnection from '../controllers/ModeConnection';
import AppContext from '../controllers/AppContext';

const enySensor = require('../common_images/sensors/eny-sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

export const SensorModule: React.FC<SensorModuleProps> = (props: SensorModuleProps) => {
    const [activeSensors, setActiveSensors] = useState<number>(5);
    const [batteryPower, setBatteryPower] = useState<number>(0.1);
    const [sensingInterval, setSensingInterval] = useState<string>('5 secs');
    const [graphTimespan, setGraphTimespan] = useState<string>('hour');

    useEffect(
        () => {
            AppContext.restoreLogin();
    },  []);
    return (
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
                            <div className="device-name">Device name</div>
                            <div className="gateway-name">Gateway name: </div>
                            <div className="sensor-model">Sensor model: </div>
                        </div>
                        <button>•••</button>
                    </div>
                    <div className="data-col">
                        <div className="data-name">Sensors Active</div>
                        <div className="data-value">{activeSensors}</div>
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
                {/* FOR EACH SENSOR THIS ROW */}
                <div className="sensor-graph-container">
                    <div className="sensor-container">
                        <div className="unit-rt-container">
                            <div className="header">
                                Temperature
                            </div>
                            <div className="unit-value">
                                80.0
                            <span className="degree">°F</span>
                            </div>
                        </div>
                        <div className="graph-container">
                            #
                        </div>
                        <div className="graph-info-container">
                            <div>{`Maximum: `}</div>
                            <div>{`Minimum: `}</div>
                            <div>{`Average: `}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SensorModule;
