import { MODULE_CATELOG } from './Constants';
import { SensorModuleDefinition } from '../components/entities/SensorModule';

/**
 * load all the sensor module icons that we know of
 */
const sensorModuleIconGeneric = require('../common_images/sensor_modules/generic-module.svg');
const sensorModuleIconAlpsSnm3 = require('../common_images/sensor_modules/alps-snm3.png');
const sensorModuleIconAlpsSubg1 = require('../common_images/sensor_modules/alps-subg.png');
const sensorModuleIconOmron2jciebl01 = require('../common_images/sensor_modules/omron-2jcie-bl01.png');
const sensorModuleIconOmron2jciebu01 = require('../common_images/sensor_modules/omron-2jcie-bu01.png');
const sensorModuleIconPanasonicEny = require('../common_images/sensor_modules/eny-sensor.png');
const sensorModuleIconLapiSmj1011 = require('../common_images/sensor_modules/lapis-mj1011.png');
const sensorModuleIconUniDenshiLogttaCo2Uni02 = require('../common_images/sensor_modules/logtta_co2_uni-02.png');
const sensorModuleIconMioMS106 = require('../common_images/sensor_modules/mio-sensor-ms_106.png');
const sensorModuleIconJetecWsc120 = require('../common_images/sensor_modules/jetec-wsc-120.png');
const sensorModuleIconTwelite2525a = require('../common_images/sensor_modules/twelite-2525a.png');
const sensorModuleIconRohmSensorMedal = require('../common_images/sensor_modules/rohm-sensor-medal.png');
const sensorModuleIconRionNl42 = require('../common_images/sensor_modules/rion-nl42.png');
const sensorModuleIconRionVm55 = require ('../common_images/sensor_modules/rion-vm55.png');
const sensorModuleIconChugaiDust = require('../common_images/sensor_modules/chugai-dust.png');
const sensorModuleIconSwTbSensor = require('../common_images/sensor_modules/sw-tb-sensor.jpg');
const sensorModuleIconDeltaSeatSensor = require('../common_images/sensor_modules/delta-seat-sensor.png');
const sensorModuleIconTohokChair = require('../common_images/sensor_modules/tohoku-chair.png');
const sensorModuleIconSwTeSensor = require('../common_images/sensor_modules/sw-te-sensor.jpg');

/**
 * Build a map of sensor module icon name -> sensor module icon image. The icon name will come
 * from the sensor module definition from the catalog.
 */
const sensorModuleIconMap: Map<string, string> = new Map<string, string>(Object.entries({
  'alps-snm3.png': sensorModuleIconAlpsSnm3,
  'alps-subg.png': sensorModuleIconAlpsSubg1,
  'generic-module.svg': sensorModuleIconGeneric,
  'omron-2jcie-bl01.png': sensorModuleIconOmron2jciebl01,
  'omron-2jcie-bu01.png': sensorModuleIconOmron2jciebu01,
  'jetec-wsc-120.png': sensorModuleIconJetecWsc120,
  'twelite-2525a.png': sensorModuleIconTwelite2525a,
  'rohm-sensor-medal.png': sensorModuleIconRohmSensorMedal,
  'lapis-mj1011.png': sensorModuleIconLapiSmj1011,
  'rion-nl42.png': sensorModuleIconRionNl42,
  'rion-vm55.png': sensorModuleIconRionVm55,
  'chugai-dust.png': sensorModuleIconChugaiDust,
  'sw-tb-sensor.jpg': sensorModuleIconSwTbSensor,
  'sw-te-sensor.jpg': sensorModuleIconSwTeSensor,
  'delta-seat-sensor.png': sensorModuleIconDeltaSeatSensor,
  'eny-sensor.png': sensorModuleIconPanasonicEny,
  'mio-sensor-ms_106.png': sensorModuleIconMioMS106,
  'tohoku-chair.png': sensorModuleIconTohokChair,
  'logtta_co2_uni-02.png': sensorModuleIconUniDenshiLogttaCo2Uni02,
}));

/**
 * Load all sensor icon that we know of
 */
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

/**
 * helper method for determining the unit associated with a provided sensor type.
 * @param sensorType 
 */
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
 * For example: given this ID, 0101:34c731ffe6c1, this function returns {modelId: 0101, uid:34c731ffe6c1}
 * We need to do this alot so it is better to use this function to do it. Also, this helper
 * function will also take a separator incase we use a different separator for other sensors.
 */
export function parseSensorUUID (sensorId: string, separator: string = ':'): {modelId: string, uid: string} {
  const tokens: string[] = sensorId.split(separator);
  return {
    modelId: tokens[0],
    uid: tokens[1]
  };
}

/**
 * Get the sensor module definition by model id. This will return an instance of SensorModuleDefinition
 * if a sensor module definition is found from the MODULE_CATALOG. Otherwise, this function will return
 * undefined.
 * @param modelId 
 */
export function evaluateSensorModel (modelId: string): SensorModuleDefinition | undefined {
  return MODULE_CATELOG.find((sensorModule: any): boolean => {
    return sensorModule.modelId === modelId;
  });
}

/**
 * Get the sensor module definition name by model id
 * @param modelId 
 */
export function evaluateSensorModelName (modelId: string): string {
  const discoveredModule: SensorModuleDefinition | undefined = evaluateSensorModel(modelId);
  if (discoveredModule) {
    return discoveredModule.name;
  } else {
    return '';
  }
}

/**
 * Get the sensor module definition image by model id
 * @param modelId 
 */
export function evaluateSensorModelIcon (modelId: string): string {
  const discoveredModule: SensorModuleDefinition | undefined = evaluateSensorModel(modelId);
  if (discoveredModule) {
    const sensorIcon: string | undefined = sensorModuleIconMap.get(discoveredModule.iconName);
    if (sensorIcon !== undefined) {
      return sensorIcon;
    } else {
      return sensorModuleIconGeneric;
    }
  } else {
    return sensorModuleIconGeneric;
  }
}

/**
 * helper method for determining the image associated with a provided sensor type.
 * @param sensorType 
 */
export function evaluateSensorTypes(sensorType: any): string | undefined {
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
