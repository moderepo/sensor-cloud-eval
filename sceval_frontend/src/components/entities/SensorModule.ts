import { KeyValueStore } from '../../controllers/ModeAPI';
export default interface SensorModuleSet {
    device: string;
    sensorModules: Array<SensorModuleInterface>;
}
export interface SensorModuleInterface extends Omit<KeyValueStore, 'value'> {
    value: {
        id: string;
        interval: number;
        sensing: string;
        sensors: Array<any>;
    };
}
