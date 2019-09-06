import { KeyValueStore, Device, TimeSeriesBounds } from '../../components/entities/API';
import { TimeSeriesData } from './API';
export interface SensorModuleSet {
    // associated device
    device: Device;
    // sensor module set
    sensorModules: Array<SensorModuleInterface>;
}
export interface SensorModuleInterface extends Omit<KeyValueStore, 'value'> {
    value: {
        // sensor module id
        id: string;
        // assoociated gateway
        gateway: number;
        // sensing interval
        interval: number;
        // sensing (off/on)
        sensing: string;
        // active sensors
        sensors: Array<any>;
        // sensor module name
        name: string;
    };
}
export interface AddSensorModuleState {
    // available sensor modules
    availableModules: Array<any>;
    // linked sensor modules
    associatedModules: Array<any>;
    // module metadata
    moduleMetadata: Array<any>;
    // modules selected to add
    selectedModules: Array<any>;
    // gateway targeted for pairing
    selectedGateway: string;
    // scanning state
    scanning: boolean;
    // scanning progress (0-100)
    scanningProgress: number;
    // no modules found state
    noModules: boolean;
}
export interface SensorDataBundle {
    seriesId: string;
    // sensor data unit
    unit: string;
    // sensor data type
    type: string;
    // time-series data for sensor
    beginDate: string;
    endDate: string;
    TSDBData: TimeSeriesData;
    timeSeriesDataSnapshot: TimeSeriesData;
    avgVal: string;
    minVal: string;
    maxVal: string;
    isChartActive: boolean;
}

export interface ZoomData {
    startTime: number;
    endTime: number;
    startDate: string;    // string representation of startTime in ISO date string
    endDate: string;      // string representation of endTime in ISO date string
}

export interface SensingInterval {
    value: number;
    unit: string;
    multiplier: number;
}
