import { KeyValueStore, Device, TimeSeriesBounds, DataPoint } from '../../components/entities/API';
import { TimeSeriesData } from './API';

export interface SensorModelInterface {
    modelId: string;
    vendor: string;
    vendorModelId: string;
    name: string;
    description: string;
    moduleSchema: string[];
    iconName: string;
    canChangeInterval: boolean;
    serviceId: string;
    moduleSchemaDisplayNames?: any;        // A map of sensor type => user friendly name
    isPlaceholder?: boolean;
    parentModelId?: string;
    needConductivityConv?: boolean;
}

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
    seriesId: string | null;
    // sensor data unit
    unit: string;
    // sensor data type
    type: string;
    name: string;       // same as name but more user friendly, without the :0
    // Whether or not this sensor is active
    active: boolean;
    // the boundaries of the time series data, the date of the very first and very last data point
    allTimeDateBounds: DateBounds;
    // snapshot of the time series data from the very first to very last data point
    timeSeriesDataSnapshot: DataPoint[];
    // The date bounds of the current timeSeriesData we previously requested. We keep track of this
    // bounds so that if something trigger the data to be loaded again, we can skip it since we already have the data.
    currentDateBounds: DateBounds;
    // time-series data for sensor
    timeSeriesData: DataPoint[];
    // The most recent data point, use for realtime chart
    currentDataPoint: DataPoint;
    avgVal: number;
    minVal: number;
    maxVal: number;
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

export interface ChartTimespan {
    label: string;  // The label to be displayed to the user e.g. "15 minutes", "1 Hour", etc...
    value: number;  // The value correspond to the label in millisecs e.g. 900000 for 15 mins and 3600000 for 1 hours
}
