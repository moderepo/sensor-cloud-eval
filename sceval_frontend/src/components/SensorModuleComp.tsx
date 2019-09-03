import React from 'react';
import { SensorModuleInterface } from './entities/SensorModule';
import { evaluateSensorTypes } from '../utils/SensorTypes';
import '../css/SensorModuleComp.css';

const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const checkMark = require('../common_images/notifications/check-1.svg');

interface SensorModuleCompProps extends React.Props<any> {
  id?: string;
  name?: string;
  model?: string;
  sensors: string[];
  isOff?: boolean;
  isEditing?: boolean;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const SensorModuleComp: React.FC<SensorModuleCompProps> = (props: SensorModuleCompProps) => {

  return (
    <a
      className={`sensor-module d-flex flex-row align-items-center` +
        `${props.isOff ? ' off' : ''}` +
        `${props.isEditing ? ' editing' : ''}` +
        `${props.isSelected ? ' selected' : ''}`
      }
      onClick={ (event: React.MouseEvent<HTMLElement>): void => {
        if (props.onClick instanceof Function) {
          props.onClick(event);
        }
      }}
    >
      <img className="module-image d-flex align-items-center" src={sensorGeneral} />
      <img className="checked-module" src={checkMark}/>
      <div className="x-icon">x</div>
      <div className="module-info d-flex align-items-start flex-column">
        <div className="module-info-top d-flex flex-column align-items-top">
          {props.name && <div className="sensor-module-name">{props.name}</div>}
          {props.id && <div className="sensor-module-id">ID: {props.id}</div>}
          {props.model && <div className="sensor-module-model">Model: {props.model}</div>}
        </div>
        <div className="module-sensors d-flex flex-row flex-wrap align-items-center justify-content-start">
          {props.sensors &&
            // render custom sensor images
            props.sensors.map((sensorType, sensorIndex) => {
              const type = sensorType.split(':')[0];
              return (
                <img
                  key={sensorIndex}
                  className="sensor-type-image"
                  src={evaluateSensorTypes(type)}
                />
              );
            })
          }
        </div>
      </div>
    </a>
  );
};

export default SensorModuleComp;