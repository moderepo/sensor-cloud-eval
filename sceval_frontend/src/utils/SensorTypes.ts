export default function determineUnit(sensorType: string) {
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