import { KeyValueStore, Device } from '../../controllers/ModeAPI';
export default interface SensorModuleSet {
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
