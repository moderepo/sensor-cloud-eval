import { KeyValueStore, Device } from '../../components/entities/API';
import { TimeSeriesData } from './API';
export interface SensorModuleSet {
    device: Device;
    sensorModules: Array<SensorModuleInterface>;
}
export interface SensorModuleInterface extends Omit<KeyValueStore, 'value'> {
    value: {
        id: string;
        gateway: number;
        interval: number;
        sensing: string;
        sensors: Array<any>;
        name: string;
    };
}
export interface AddSensorModuleState {
    availableModules: Array<any>;
    associatedModules: Array<any>;
    moduleMetadata: Array<any>;
    selectedModules: Array<any>;
    selectedGateway: string;
    scanning: boolean;
    scanningProgress: number;
    noModules: boolean;
}
export interface SensorDataBundle {
    unit: string;
    type: string;
    TSDBData: TimeSeriesData;
}

export interface SensingInterval {
    value: number;
    unit: string;
    multiplier: number;
}
