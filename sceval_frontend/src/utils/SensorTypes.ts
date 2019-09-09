import { MODULE_CATELOG } from './Constants';
import { SensorModelInterface } from '../components/entities/SensorModule';

export function determineUnit(sensorType: string) {
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
    case 'magnetic_x':
      return 'N';
    case 'magnetic_y':
      return 'N';
    case 'magnetic_z':
      return 'N';
    case 'acceleration_x':
      return 'm/s²';
    case 'acceleration_y':
      return 'm/s²';
    case 'acceleration_z':
      return 'm/s²';
    case 'omron_discomfort':
      return '';
    case 'omron_heatstroke':
      return '';
    default:
      return;
  }
}

/**
 * Given a sensor id which contains sensor model and id separated by ":". Parse the ID
 * and return the data as an object with separated model and id.
 * We need to do this alot so it is better to use this function to do it. Also, this helper
 * function will also take a separator incase we use a different separator for other sensors.
 */
export function parseSensorId (sensorId: string, separator: string = ':'): any {
  const tokens: string[] = sensorId.split(separator);
  return {
    model: tokens[0],
    id: tokens[1]
  };
}

/**
 * Get the sensor model definition by model id
 * @param modelId 
 */
export function evaluateSensorModel (modelId: string): SensorModelInterface | undefined {
  return MODULE_CATELOG.find((sensorModule: any): boolean => {
    return sensorModule.modelId === modelId;
  });
}

/**
 * Get the sensor model name by model id
 * @param modelId 
 */
export function evaluateSensorModelName (modelId: string): string {
  const discoveredModule = evaluateSensorModel(modelId);
  if (discoveredModule) {
    return discoveredModule.name;
  } else {
    return '';
  }
}

export function evaluateSensorTypes(sensorType: any): string | undefined {
  const sensorHumidity = require('../common_images/sensors/humidity-active.svg');
  const sensorLight = require('../common_images/sensors/uv-active.svg');
  const sensorUV = require('../common_images/sensors/uv-active.svg');
  const sensorPressure = require('../common_images/sensors/pressure-active.svg');
  const sensorTemp = require('../common_images/sensors/temp-active.svg');
  const sensorCount = require('../common_images/sensors/count-active.svg');
  const sensorMagnetic = require('../common_images/sensors/battery-active.svg');
  const acceleration = require('../common_images/sensors/generic-active.svg');
  const sound = require('../common_images/sensors/noise-active.svg');
  const omronDiscomport = require('../common_images/sensors/discomfort-active.svg');
  const omronHeatstroke = require('../common_images/sensors/heatstroke-active.svg');

  switch (sensorType) {
    case 'TEMPERATURE':
      return sensorTemp;
    case 'HUMIDITY':
      return sensorHumidity;
    case 'AMBIENT':
      return sensorLight;
    case 'UV':
      return sensorUV;
    case 'PRESSURE':
      return sensorPressure;
    case 'MAGNETIC_X':

    case 'MAGNETIC_Y':
    case 'MAGNETIC_Z':
      return sensorMagnetic;
    case 'ACCELERATION_X':
    case 'ACCELERATION_Y':
    case 'ACCELERATION_Z':
      return acceleration;
    case 'COUNT':
      return sensorCount;
    case 'ENY_CH_NO':
      return sensorCount;
    case 'ENY_SEQ_NO':
      return sensorCount;
    case 'ENY_CUM_NO':
      return sensorCount;
    case 'OMRON_DISCOMFORT':
      return omronDiscomport;
    case 'OMRON_HEATSTROKE':
      return omronHeatstroke;
    case 'SOUND':
      return sound;
    default:
      return;
  }
}
