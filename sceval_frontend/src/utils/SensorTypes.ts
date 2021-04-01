import * as Constants from './Constants';
import { SensorModuleDefinition } from '../components/entities/SensorModule';

/**
 * load all the sensor module icons that we know of
 */
import sensorModuleIconGeneric from '../common_images/sensor_modules/generic-module.svg';
import sensorModuleIconAlpsSnm3 from '../common_images/sensor_modules/alps-snm3.png';
import sensorModuleIconAlpsSubg1 from '../common_images/sensor_modules/alps-subg.png';
import sensorModuleIconOmron2jciebl01 from '../common_images/sensor_modules/omron-2jcie-bl01.png';
import sensorModuleIconOmron2jciebu01 from '../common_images/sensor_modules/omron-2jcie-bu01.png';
import sensorModuleIconPanasonicEny from '../common_images/sensor_modules/eny-sensor.png';
import sensorModuleIconLapiSmj1011 from '../common_images/sensor_modules/lapis-mj1011.png';
import sensorModuleIconUniDenshiLogttaCo2Uni02 from '../common_images/sensor_modules/logtta_co2_uni-02.png';
import sensorModuleIconMioMS106 from '../common_images/sensor_modules/mio-sensor-ms_106.png';
import sensorModuleIconJetecWsc120 from '../common_images/sensor_modules/jetec-wsc-120.png';
import sensorModuleIconTwelite2525a from '../common_images/sensor_modules/twelite-2525a.png';
import sensorModuleIconRohmSensorMedal from '../common_images/sensor_modules/rohm-sensor-medal.png';
import sensorModuleIconRionNl42 from '../common_images/sensor_modules/rion-nl42.png';
import sensorModuleIconRionVm55 from '../common_images/sensor_modules/rion-vm55.png';
import sensorModuleIconChugaiDust from '../common_images/sensor_modules/chugai-dust.png';
import sensorModuleIconSwTbSensor from '../common_images/sensor_modules/sw-tb-sensor.jpg';
import sensorModuleIconDeltaSeatSensor from '../common_images/sensor_modules/delta-seat-sensor.png';
import sensorModuleIconTohokChair from '../common_images/sensor_modules/tohoku-chair.png';
import sensorModuleIconSwTeSensor from '../common_images/sensor_modules/sw-te-sensor.jpg';

/**
 * Load all sensor icon that we know of
 */
import sensorHumidity from '../common_images/sensors/humidity-active.svg';
import sensorLight from '../common_images/sensors/uv-active.svg';
import sensorUV from '../common_images/sensors/uv-active.svg';
import sensorPressure from '../common_images/sensors/pressure-active.svg';
import sensorTemp from '../common_images/sensors/temp-active.svg';
import sensorCount from '../common_images/sensors/count-active.svg';
import sensorMagnetic from '../common_images/sensors/battery-active.svg';
import acceleration from '../common_images/sensors/generic-active.svg';
import sound from '../common_images/sensors/noise-active.svg';
import omronDiscomport from '../common_images/sensors/discomfort-active.svg';
import omronHeatstroke from '../common_images/sensors/heatstroke-active.svg';

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
 * Given a timeseries id, parse it and break it into 2 parts, sensor module id and sensor type.
 * For example: if series id is "0107:dca7dd5461d7-temperature:0", the function will return
 *   {
 *     moduleUUID: "0107:dca7dd5461d7",
 *     sensorType: "temperature:0"
 *   }
 * @param seriesId 
 * @param separator 
 */
export function parseTimeseriesId (
  seriesId: string,
  separator: string = '-'
): {moduleUUID: string, sensorType: string} {
  const tokens: string[] = seriesId.split(separator);
  return {
    moduleUUID: tokens[0],
    sensorType: tokens[1]
  };
}

/**
 * Given a sensor module id which contains sensor model and id separated by ":". Parse the ID
 * and return the data as an object with separated model and id.
 * For example: given this ID, 0101:34c731ffe6c1, this function returns {modelId: 0101, uid:34c731ffe6c1}
 * We need to do this alot so it is better to use this function to do it. Also, this helper
 * function will also take a separator incase we use a different separator for other sensors.
 */
export function parseSensorModuleUUID (
  sensorId: string,
  separator: string = ':'
): {modelId: string, uid: string} {
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
  return Constants.MODULE_CATELOG.find((sensorModule: any): boolean => {
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
  } else if (modelId === Constants.CUSTOM_SENSOR_MODULE_MODEL_ID) {
    return Constants.CUSTOM_SENSOR_MODULE_MODEL_ID;
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
