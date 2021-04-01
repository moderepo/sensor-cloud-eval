import React from 'react';
import { evaluateSensorTypes, evaluateSensorModelIcon, parseSensorModuleUUID } from '../utils/SensorTypes';
import '../css/SensorModuleComp.css';

import checkMark from '../common_images/notifications/check-1.svg';

interface SensorModuleCompProps extends React.Props<any> {
  id: string;           // Sensor module UUID
  name?: string;
  modelId: string;      // Sensor module's modelId
  model: string;        // Sensor module's model name
  sensors: string[];
  isOff?: boolean;
  isEditing?: boolean;
  isSelected?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const SensorModuleComp: React.FC<SensorModuleCompProps> = (props: SensorModuleCompProps) => {

  return (
    <div
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
      <img
        className="module-image d-flex align-items-center"
        src={evaluateSensorModelIcon(parseSensorModuleUUID(props.modelId).modelId)}
        alt="sensor module icon"
      />
      <img className="checked-module" src={checkMark} alt="selected-icon"/>
      <div className="x-icon">x</div>
      <div className="module-info d-flex align-items-start flex-column">
        <div className="module-info-top d-flex flex-column align-items-top">
          {/* If name is available, show name, else show ID */}
          {(props.name || props.id) && <div className="sensor-module-name">{props.name ? props.name : props.id}</div>}

          {/* If name is available which means we showed name above so need to show ID */}
          {(props.name && props.id) && <div className="sensor-module-id">ID: {props.id}</div>}

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
                  alt="sensor icon"
                />
              );
            })
          }
        </div>
      </div>
    </div>
  );
};

export default SensorModuleComp;
