export default interface SensorModuleSet {
    device: string;
    sensorModules: Array<SensorModule>;
}
interface SensorModule {
    key: string;
    modificationTime: string;
    value: {
        id: string;
        interval: string;
        sensing: string;
        sensors: Array<any>;
    };
}