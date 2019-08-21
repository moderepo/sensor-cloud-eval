export default interface SensorModuleSet {
    device: string;
    sensorModules: Array<SensorModuleInterface>;
}
export interface SensorModuleInterface {
    key: string;
    modificationTime: string;
    value: {
        id: string;
        interval: string;
        sensing: string;
        sensors: Array<any>;
        name?: string;
    };
}