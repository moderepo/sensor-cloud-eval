import { SensorModelInterface } from '../components/entities/SensorModule';

export namespace Constants {
  export const SENSOR_MODULE_KEY_PREFIX: string = 'sensorModule';

  export const EVENT_SENSOR_MODULE_LIST: string = 'sensorModuleList';
  export const EVENT_SENSOR_MODULE_UNREGISTERED: string =
    'sensorModuleUnregistered';
  export const EVENT_SENSOR_MODULE_STATE_CHANGE: string =
    'sensorModuleStateChange';
  export const EVENT_DISCOVERED_SENSOR_MODULES: string =
    'discoveredSensorModules';
  export const EVENT_REALTIME_DATA: string = 'realtimeData';
  export const EVENT_TIME_SERIES_DATA: string = 'timeSeriesData';
  export const ALPS_SENSOR_SET: Array<string> = [
    'TEMPERATURE:0',
    'HUMIDITY:0',
    'UV:0',
    'PRESSURE:0',
    'AMBIENT:0',
    'MAGNETIC_X:0',
    'ACCELERATION_Y:0',
    'ACCELERATION_Z:0',
    'MAGNETIC_Y:0',
    'MAGNETIC_Z:0',
    'ACCELERATION_X:0'
  ];
  export const ERROR_USER_NOT_FOUND: string = 'USER_NOT_FOUND';
  export const ERROR_CONNECTION_ERROR: string = 'CONNECTION_ERROR';
  export const ERROR_LOGIN_CREDENTIALS_NOT_PRESENT: string =
    'LOGIN_CREDENTIALS_NOT_PRESENT';

  // The maximum number of data points we want to show on the data series snapshot
  export const SNAPSHOT_CHART_MAX_DATA_POINTS: number = 100;

  // How long to delay before dispatching chart zoom event
  export const CHART_ZOOM_EVENT_DELAY_IN_MS: number = 20;
  export const CHART_FETCH_DATA_DELAY_IN_MS: number = 3000;

  // Months and years values will assume months are 30 days and years are 365 days. This is not
  // accurate but it is good enough. If you need a correct value, don't use these constants.
  export const MINUTE_IN_SECS: number     = 60;       // 1 minute in seconds
  export const MINUTE_IN_MS: number       = 60 * 1000;  // 1 minute in milliseconds
  export const HOUR_IN_SECS: number       = 60 * 60;
  export const HOUR_IN_MS: number         = 60 * 60 * 1000;
  export const DAY_IN_SECS: number        = 60 * 60 * 24;
  export const DAY_IN_MS: number          = 60 * 60 * 24 * 1000;
  export const WEEK_IN_SECS: number       = 60 * 60 * 24 * 7;
  export const WEEK_IN_MS: number         = 60 * 60 * 24 * 7 * 1000;
  export const MONTH_IN_SECS: number      = 60 * 60 * 24 * 30;
  export const MONTH_IN_MS: number        = 60 * 60 * 24 * 30 * 1000;
  export const YEAR_IN_SECS: number       = 60 * 60 * 24 * 356;
  export const YEAR_IN_MS: number         = 60 * 60 * 24 * 356 * 1000;
  export const DECADE_IN_SECS: number     = 60 * 60 * 24 * 356 * 10;
  export const DECADE_IN_MS: number       = 60 * 60 * 24 * 356 * 10 * 1000;
  export const CENTURY_IN_SECS: number    = 60 * 60 * 24 * 356 * 100;
  export const CENTURY_IN_MS: number      = 60 * 60 * 24 * 356 * 100 * 1000;
  export const MILLENNIUM_IN_SECS: number = 60 * 60 * 24 * 356 * 1000;
  export const MILLENNIUM_IN_MS: number   = 60 * 60 * 24 * 356 * 1000 * 1000;
}

export const MODULE_CATELOG: SensorModelInterface[] = [
  {
    'modelId': '0101',
    'vendor': 'Alps',
    'vendorModelId': 'SNM3',
    'name': 'Alps SNM',
    'description': 'Alps Sensor Network Module (BLE)',
    'moduleSchema': [
      'TEMPERATURE:0',
      'HUMIDITY:0',
      'PRESSURE:0',
      'AMBIENT:0',
      'UV:0',
      'MAGNETIC_X:0',
      'MAGNETIC_Y:0',
      'MAGNETIC_Z:0',
      'ACCELERATION_X:0',
      'ACCELERATION_Y:0',
      'ACCELERATION_Z:0'
    ],
    'iconName': 'alps-snm3.png',
    'canChangeInterval': true,
    'serviceId': 'BLE',
    'moduleSchemaDisplayNames': {
      'MAGNETIC_X:0': 'Magnetic X',
      'MAGNETIC_Y:0': 'Magnetic Y',
      'MAGNETIC_Z:0': 'Magnetic Z',
      'ACCELERATION_X:0': 'Acceleration X',
      'ACCELERATION_Y:0': 'Acceleration Y',
      'ACCELERATION_Z:0': 'Acceleration Z'
     }
  },
  {
    'modelId': '0102',
    'vendor': 'Alps',
    'vendorModelId': 'SubG1',
    'name': 'Alps ESM',
    'description': 'Alps Environmental Sensor Module (Sub-1GHz)',
    'moduleSchema': ['TEMPERATURE:0', 'HUMIDITY:0', 'PRESSURE:0', 'AMBIENT:0'],
    'iconName': 'alps-subg.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0103',
    'vendor': 'TI',
    'vendorModelId': 'CC2650STK',
    'name': 'BLE Sensor Module',
    'description': 'Generic BLE-based sensor module',
    'moduleSchema': ['TEMPERATURE:0', 'HUMIDITY:0', 'PRESSURE:0', 'AMBIENT:0'],
    'iconName': 'generic-module.svg',
    'canChangeInterval': true,
    'serviceId': 'BLE'
  },
  {
    'modelId': '0104',
    'vendor': 'MODE',
    'vendorModelId': 'Dummy1',
    'name': 'Dummy1',
    'description': 'Simulated sensor module for testing',
    'moduleSchema': ['TEMPERATURE:0', 'TEMPERATURE:1', 'HUMIDITY:0', 'PRESSURE:0', 'AMBIENT:0', 'UV:0'],
    'iconName': 'generic-module.svg',
    'canChangeInterval': false,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0105',
    'vendor': 'Seiko',
    'vendorModelId': 'SW4210',
    'name': 'SW4210',
    'description': 'Seiko temperature & humidity sensor',
    'moduleSchema': ['TEMPERATURE:0', 'HUMIDITY:0', 'AMBIENT:0'],
    'iconName': 'generic-module.svg',
    'canChangeInterval': false,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0106',
    'vendor': 'Seiko',
    'vendorModelId': 'SW4230',
    'name': 'SW4230',
    'description': 'Seiko CO2 sensor',
    'moduleSchema': ['CO2:0'],
    'iconName': 'generic-module.svg',
    'canChangeInterval': false,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0107',
    'vendor': 'OMRON',
    'vendorModelId': '2JCIE-BL01',
    'name': 'OMRON Environment Sensor BL01',
    'description': 'OMRON Bluetooth Environmental Sensor',
    'moduleSchema': 
    ['TEMPERATURE:0', 'HUMIDITY:0', 'AMBIENT:0', 'UV:0', 'PRESSURE:0', 'SOUND:0', 
    'OMRON_DISCOMFORT:0', 'OMRON_HEATSTROKE:0'],
    'iconName': 'omron-2jcie-bl01.png',
    'canChangeInterval': false,
    'serviceId': 'BLE'
  },
  {
    'modelId': '0108',
    'vendor': 'Jetec',
    'vendorModelId': 'WSC-120',
    'name': 'Jetec Compact Weather Station',
    'description': 'Jetec Compact Weather Station WSC-120',
    'moduleSchema': ['TEMPERATURE:0', 'HUMIDITY:0', 'WIND_SPEED:0', 'WIND_DIRECTION:0', 'PRECIPITATION:0'],
    'iconName': 'jetec-wsc-120.png',
    'canChangeInterval': true,
    'serviceId': 'MODBUS'
  },
  {
    'modelId': '0109',
    'vendor': 'MONO WIRELESS',
    'vendorModelId': 'MONOSTICK',
    'name': 'MONOSTICK',
    'description': 'KMONOSTICK',
    'moduleSchema': [],
    'iconName': 'generic-module.svg',
    'canChangeInterval': false,
    'isPlaceholder': true,
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0112',
    'vendor': 'Mono Wireless',
    'vendorModelId': 'TWELITE2525A',
    'name': 'TWELITE 2525A',
    'description': 'Mono Wireless TWELITE 2525A',
    'moduleSchema': ['MONOWIRELESS_SHAKE:0', 'VOLTAGE:0', 'LQI:0'],
    'iconName': 'twelite-2525a.png',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0113',
    'vendor': 'Rohm',
    'vendorModelId': 'SensorMedal-EVK-001',
    'name': 'Sensor Medal EVK-001',
    'description': 'Rohm Sensor Medal EVK-001',
    'moduleSchema': ['PRESSURE:0'],
    'iconName': 'rohm-sensor-medal.png',
    'canChangeInterval': true,
    'serviceId': 'BLE'
  },
  {
    'modelId': '0114',
    'vendor': 'Lapis',
    'vendorModelId': 'MJ1011',
    'name': 'Lapis Soil Sensor MJ1011',
    'description': 'Lapis Soil Sensor',
    'moduleSchema': ['TEMPERATURE:0', 'VOLTAGE:0', 'ACIDITY:0', 'CONDUCTIVITY:0'],
    'iconName': 'lapis-mj1011.png',
    'canChangeInterval': true,
    'serviceId': 'LAPIS_SOIL',
    // TODO: This is temporary solution to convert S/m to mS/cm
    // Need to consider the holistic sotluion to handle export etc...
    // The actual conversion happens in unitDenormalization of SensorDataService
    'needConductivityConv': true
  },
  {
    'modelId': '0115',
    'vendor': 'Rion',
    'vendorModelId': 'NL42',
    'name': 'Rion NL42',
    'description': 'Rion Noise Sensor NL42',
    'moduleSchema': ['SOUND:0', 'SOUND:1'],
    'iconName': 'rion-nl42.png',
    'canChangeInterval': true,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0116',
    'vendor': 'Rion',
    'vendorModelId': 'VM55',
    'name': 'Rion VM55',
    'description': 'Rion Vibration Sensor VM55',
    'moduleSchema': ['VIBRATION:0', 'VIBRATION:1'],
    'iconName': 'rion-vm55.png',
    'canChangeInterval': true,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0117',
    'vendor': 'Chugai',
    'vendorModelId': 'ChugaiParticleWind',
    'name': 'Chugai Particle Wind',
    'description': 'Chugai Particle and Wind sensor',
    'moduleSchema': ['PARTICLE:0', 'WIND_DIRECTION:0', 'WIND_SPEED:0'],
    'iconName': 'chugai-dust.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC'
  },
  {
    'modelId': '0118',
    'vendor': 'Sensors&Works',
    'vendorModelId': 'SW-TB-01-WL-EVAL',
    'name': 'Sensors&Works SW-TB-01-WL-EVAL',
    'description': 'Sensors&Works TypeB 01 Eval',
    'moduleSchema': ['LQI:0', 'COUNT:0', 'COUNT:1', 'VALUE:0', 'VALUE:1', 'DURATION:0'],
    'moduleSchemaDisplayNames': {
      'COUNT:0': 'Left',
      'COUNT:1': 'Right',
      'VALUE:0': 'Amp1',
      'VALUE:1': 'Amp2',
      'DURATION:0': 'Move Time',
    },
    'iconName': 'sw-tb-sensor.jpg',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0119',
    'vendor': 'Sensors&Works',
    'vendorModelId': 'SW-TB-02-WL-EVAL',
    'name': 'Sensors&Works SW-TB-02-WL-EVAL',
    'description': 'Sensors&Works TypeB 02 Eval',
    'moduleSchema': ['LQI:0', 'COUNT:0', 'COUNT:1'],
    'iconName': 'sw-tb-sensor.jpg',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0120',
    'vendor': 'Sensors&Works',
    'vendorModelId': 'SW-TB-03-WL-EVAL',
    'name': 'Sensors&Works SW-TB-03-WL-EVAL',
    'description': 'Sensors&Works TypeB Eval',
    'moduleSchema': ['LQI:0', 'COUNT:0', 'COUNT:1', 'VALUE:0', 'VALUE:1', 'DURATION:0'],
    'iconName': 'sw-tb-sensor.jpg',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0121',
    'vendor': 'Sensors&Works',
    'vendorModelId': 'SW-TB-04-WL-EVAL',
    'name': 'Sensors&Works SW-TB-04-WL-EVAL',
    'description': 'Sensors&Works TypeB Eval',
    'moduleSchema': ['LQI:0', 'COUNT:0', 'COUNT:1'],
    'iconName': 'sw-tb-sensor.jpg',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  },
  {
    'modelId': '0122',
    'vendor': 'Delta',
    'vendorModelId': 'DeltaSeatSensor',
    'name': 'Delta Seat Sensor',
    'description': 'Delta Seat Sensor',
    'moduleSchema': ['MODE_HEALTH_INDEX:0', 'FREQUENCY:0', 'VALUE:0', 'FREQUENCY:1', 'VALUE:1'],
    'iconName': 'delta-seat-sensor.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC',
    'moduleSchemaDisplayNames': {
      'MODE_HEALTH_INDEX:0': 'Health Index',
      'FREQUENCY:0':         'Zero Freq',
      'VALUE:0':             'Zero Slope',
      'FREQUENCY:1':         'Peak Freq',
      'VALUE:1':             'Peak Slope'
     }
  },
  {
    'modelId': '0123',
    'vendor': 'Panasonic',
    'vendorModelId': 'EnySensor',
    'name': 'eny Button',
    'description': 'eny Button',
    'moduleSchema': ['COUNT:0', 'ENY_CUM_NO:0', 'ENY_SEQ_NO:0', 'ENY_CH_NO:0'],
    'iconName': 'eny-sensor.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC',
    'moduleSchemaDisplayNames': {
      'COUNT:0': 'Push Count',
      'ENY_CUM_NO:0': 'Cum No.',
      'ENY_SEQ_NO:0': 'Seq No.',
      'ENY_CH_NO:0': 'Ch'
     }
  },
  {
    'modelId': '0124',
    'vendor': 'Mio Corporation',
    'vendorModelId': 'MioSensorMS-106',
    'name': 'MioSensor MS-106',
    'description': 'Mio Sensor MS-106',
    'moduleSchema': ['MIO_DECISION:0', 'MIO_DECISION:1', 'MIO_DECISION:2', 'HEART_RATE:0', 'BREATHING_RATE:0',
                     'MIO_SENSING_LEVEL:0', 'MIO_SENSING_LEVEL:1', 'MIO_SENSING_LEVEL:2', 'MIO_SENSING_LEVEL:3',
                     'MIO_SENSING_LEVEL:4', 'MIO_SENSING_LEVEL:5'],
    'iconName': 'mio-sensor-ms_106.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC',
    'moduleSchemaDisplayNames': {
      'MIO_DECISION:0': 'Lie Down',
      'MIO_DECISION:1': 'Heart',
      'MIO_DECISION:2': 'Breathing',
      'HEART_RATE:0': 'Heart Rate',
      'BREATHING_RATE:0': 'Breathing Rate',
      'MIO_SENSING_LEVEL:0': 'Heart(I) Lv',
      'MIO_SENSING_LEVEL:1': 'Heart(Q) Lv',
      'MIO_SENSING_LEVEL:2': 'Breathing(I) Lv',
      'MIO_SENSING_LEVEL:3': 'Breathing(Q) Lv',
      'MIO_SENSING_LEVEL:4': 'Moving(I) Lv',
      'MIO_SENSING_LEVEL:5': 'Moving(Q) Lv'
     }
  },
  {
    'modelId': '0125',
    'vendor': 'Tohoku Univ, Torimitsu-lab',
    'vendorModelId': 'TOHOKU_CHAIR',
    'name': 'Body moving sensing chair',
    'description': 'Casual body moving sensing chair',
    'moduleSchema': ['TOHOKU_CHAIR_CH:0', 'TOHOKU_CHAIR_CH:1', 'TOHOKU_CHAIR_CH:2', 
    'TOHOKU_CHAIR_CH:3', 'TOHOKU_CHAIR_POSITION:0'],
    'iconName': 'tohoku-chair.png',
    'canChangeInterval': false,
    'serviceId': 'GENERIC',
    'moduleSchemaDisplayNames': {
      'TOHOKU_CHAIR_CH:0': 'ch1',
      'TOHOKU_CHAIR_CH:1': 'ch2',
      'TOHOKU_CHAIR_CH:2': 'ch3',
      'TOHOKU_CHAIR_CH:3': 'ch4',
      'TOHOKU_CHAIR_POSITION:0': 'Sitting position'
    }
  },
  {
    'modelId': '0126',
    'vendor': 'Uni Denshi',
    'vendorModelId': 'LOGTTA_CO2-UNI_02',
    'name': 'Logtta CO2 UNI-02',
    'description': 'Uni Denshi Co2 Sensor',
    'moduleSchema': ['CO2:0'],
    'iconName': 'logtta_co2_uni-02.png',
    'canChangeInterval': false,
    'serviceId': 'BLE'
  },
  {
    'modelId': '0127',
    'vendor': 'OMRON',
    'vendorModelId': '2JCIE-BU01',
    'name': 'OMRON Environment Sensor BU01',
    'description': 'OMRON Bluetooth Environmental Sensor',
    'moduleSchema': ['TEMPERATURE:0', 'HUMIDITY:0', 'AMBIENT:0', 'PRESSURE:0', 'SOUND:0', 'TVOC:0', 'CO2:0'],
    'iconName': 'omron-2jcie-bu01.png',
    'canChangeInterval': false,
    'serviceId': 'BLE',
    'moduleSchemaDisplayNames': {
      'TVOC:0': 'eTVOC Level',
      'CO2:0': 'eCO2 Level'
    }
  },
   {
    'modelId': '0128',
    'vendor': 'Sensors&Works',
    'vendorModelId': 'SW-TE-01-EVAL',
    'name': 'Sensors&Works SW-TE-01-EVAL',
    'description': 'Sensors&Works TypeE Eval',
     'moduleSchema': ['LQI:0', 'VALUE:0'],
    'moduleSchemaDisplayNames': {
      'VALUE:0': 'Human',
    },
    'iconName': 'sw-te-sensor.jpg',
    'canChangeInterval': false,
    'parentModelId': '0109',
    'serviceId': 'MONOSTICK'
  }
];