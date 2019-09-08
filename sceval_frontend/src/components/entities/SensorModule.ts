import { KeyValueStore, Device, TimeSeriesBounds, DataPoint } from '../../components/entities/API';
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
    // the boundaries of the time series data, the date of the very first and very last data point
    dateBounds: DateBounds;
    // snapshot of the time series data from the very first to very last data point
    timeSeriesDataSnapshot: DataPoint[];
    // time-series data for sensor
    timeSeriesData: DataPoint[];
    avgVal: string;
    minVal: string;
    maxVal: string;
    chartHasFocus: boolean;
}

export interface DateBounds {
    beginTime: number;
    endTime: number;
    beginDate: string;    // string representation of beginTime in ISO date string
    endDate: string;      // string representation of endTime in ISO date string
}

export interface SensingInterval {
    value: number;
    unit: string;
    multiplier: number;
}
