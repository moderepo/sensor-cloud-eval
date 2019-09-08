import React, { useEffect, useState, Fragment, useContext } from 'react';
import { NavLink, withRouter, RouteComponentProps, Redirect } from 'react-router-dom';
import AppContext from '../controllers/AppContext';
import { AmChart } from '../components/AmChart';
import { Context, context } from '../context/Context';
import {
    KeyValueStore,
    ErrorResponse,
    TimeSeriesData,
    TimeSeriesInfo,
    TimeSeriesBounds,
    DataPoint
} from '../components/entities/API';
import modeAPI from '../controllers/ModeAPI';
import ClientStorage from '../controllers/ClientStorage';
import moment, { Moment } from 'moment';
import { Menu, Dropdown, Icon, Checkbox, Modal, Input } from 'antd';
import ModeConnection  from '../controllers/ModeConnection';
import { determineUnit, evaluateModel } from '../utils/SensorTypes';
import {
    SensorModuleInterface,
    SensingInterval,
    SensorDataBundle,
    DateBounds
} from '../components/entities/SensorModule';
import { Constants } from '../utils/Constants';
import { Home } from '../components/entities/API';
import { RouteParams } from '../components/entities/Routes';
import { string, DateFormatter } from '@amcharts/amcharts4/core';
import { pointsToPath } from '@amcharts/amcharts4/.internal/core/rendering/Path';

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
const debounce = require('debounce');

// declare the SensorModuleProps interface
interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

export const SensorModule = withRouter((props: SensorModuleProps & RouteComponentProps<RouteParams>) => {
    // homeId state
    const [homeId, setHomeId] = useState<number>(0);
    // selected module state
    const [selectedModule, setSelectedModule] = useState<string|null>();
    // sensor module name state
    const [sensorModuleName, setSensorModuleName] = useState<string>();
    // sensor module data object state
    const [selectedSensorModuleObj, setSelectedSensorModuleObj] = useState<SensorModuleInterface|null>();
    // selected gateway state
    const [selectedGateway, setSelectedGateway] = useState<number>(0);
    // state of all TSDB data being fetched
    const [TSDBDataFetched, setTSDBDataFetched] = useState<boolean>(false);
    // state to show that the page is loading so the user doesn't think it frozen
    const [isLoading, setIsLoading] = useState<boolean>(true);
    // quantity of active sensors
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(0);
    // contains RT Websocket data
    const [activeSensors, setActiveSensors] = useState<any>();
    // contains data from TSDB fetch
    const [sensorTypes, setSensorTypes] = useState<SensorDataBundle[]>();
    // default 15 unit time horizon
    const [graphTimespanNumeric, setGraphTimespanNumeric] = useState<any>(15);
    // default minute time horizon
    const [graphTimespan, setGraphTimespan] = useState<any>('minutes');
    // current stop time (end time of data)
    const [currentStop, setCurrentStop] = useState<Moment>(moment(new Date()));
    // current start time (start time of data)
    const [currentStart, setCurrentStart] = 
    useState<Moment>(moment(new Date()).subtract(graphTimespanNumeric, graphTimespan));
    // full sensor list associated to sensor module
    const [fullSensorList, setFullSensorList] = useState();
    // list of sensors offline
    const [offlineSensors, setOfflineSensors] = useState<Array<any>>([]);
    // settings modal display state
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    // module settings visible state (dropdown)
    const [moduleSettingsVisible, setModuleSettingsVisible] = useState<boolean>(false);
    // editing sensor module settings state
    const [editingModuleSettings, setEditingModuleSettings] = useState<boolean>(false);
    // empty time-series data returned state
    const [noTSDBData, setNoTSDBData] = useState<boolean>(false);
    // declaration of a useContext hook
    const sensorContext: Context = useContext(context);
    // The min/max date bounds of all the sensor time series
    const [seriesDateBounds, setSeriesDateBounds] = useState<DateBounds>();
    // The current zoom bounds
    const [zoom, setZoom] = useState<DateBounds>();

    // to keep track of component mounted/unmounted event so we don't call set state when component is unmounted
    let componentUnmounted: boolean;

    // time-series data fetch handler method
    const performTSDBFetch =  
    (homeID: number, sensors: any, 
     sType: string, seriesID: string, 
     unit: string, wsData: any, stop?: Moment, start?: Moment,
     direction?: string
     ) => {
        // set now as reference point
        const now = new Date();
        let endTime = moment(now);
        // determine start time
        let startTime = moment(now).subtract(
            graphTimespanNumeric === '' ?
                1 : graphTimespanNumeric, 
            graphTimespan === 'real-time' ?
                'minute' : graphTimespan);
        if (stop && start) {
            endTime = stop;
            startTime = start;
        }
        // get time-series data for the provided time-range and series type
        modeAPI.getTimeSeriesData(homeID, seriesID, startTime.toISOString(), endTime.toISOString())
        .then((timeseriesData: TimeSeriesData) => {
            if (componentUnmounted) {
                return;
            }
            let maxVal = 0;
            let minVal = Infinity;
            let sum = 0;
            // if data exists
            if (timeseriesData.data.length > 0) {
                // for each set of TSDB data, perform a calculation
                timeseriesData.data.forEach((datapoint: any, datapointIndex: any) => {
                    // add to total data points
                    sum += datapoint[1];
                    // check for maximum
                    if (datapoint[1] > maxVal) {
                        maxVal = datapoint[1];
                    }
                    // check for minimum
                    if (datapoint[1] < minVal) {
                        minVal = datapoint[1];
                    }
                    // if all data points have been assessed
                    if (datapointIndex === timeseriesData.data.length - 1) {
                        // push the updated data into a sensordata object
                        const sensorData = {
                            seriesID: seriesID,
                            unit: unit,
                            type: sType,
                            TSDBData: timeseriesData,
                            avgVal: sType !== 'uv' ? 
                                (sum / datapointIndex).toFixed(1) : (sum / datapointIndex).toFixed(3),
                            maxVal: sType !== 'uv' ?
                                maxVal.toFixed(1) : maxVal.toFixed(3),
                            minVal: sType !== 'uv' ?
                                minVal.toFixed(1) : minVal.toFixed(3)
                        };
                        // push that data to the sensors array
                        sensors.push(sensorData);
                    }
                    // bundle data after going through sensor set
                    if (sensors.length === wsData.length) {
                        // if all of the sensor data has been populated, sort it alphabetically by type
                        const sortedTSDBData = sensors.sort((a: any, b: any) =>  {
                            if (a.type < b.type) {
                                return -1;
                            }
                            if (a.type > b.type) {
                                return 1;
                            }
                            return 0;
                        });
                        // set TSDB values
                        if (!TSDBDataFetched) {
                            setSensorTypes(sortedTSDBData);
                            setTSDBDataFetched(true);
                        }
                    }
                });
            }
        });
    };

    const toggleTimeSeriesState = (direction: string) => {
        let sensors: Array<any> = [];
        if (sensorTypes) {
            sensorTypes.forEach((sensor: any) =>  {
                const now =  moment(new Date());
                const stopDifference = now.diff(currentStop.toISOString(), graphTimespan);
                const newStart = currentStart.subtract(graphTimespanNumeric, graphTimespan);
                const newStop = currentStop.subtract(graphTimespan, graphTimespanNumeric);
                if (direction === 'forward') {
                    performTSDBFetch(homeId, sensors, sensor.type, sensor.seriesID, sensor.unit, sensorTypes);
                } else {
                    performTSDBFetch(
                        homeId, sensors, sensor.type, sensor.seriesID, 
                        sensor.unit, sensorTypes, newStop, newStart);
                }
            });
        }
    };

    /**
     * Given an Array of TimeSeriesData objects, return the time series data in a map.
     * @param timeSeriesDataArray
     */
    const convertTimeSeriesDataArrayToMap = (timeSeriesDataArray: TimeSeriesData[]): Map<string, DataPoint[]> => {
        return timeSeriesDataArray.reduce(
            (map: Map<string, DataPoint[]>, tsData: TimeSeriesData): Map<string, DataPoint[]> => {
                const convertedData: DataPoint[] = tsData.data.map((dataPoint: Array<any>): DataPoint => {
                    return {
                        date: dataPoint[0],
                        timestamp: moment(dataPoint[0]).valueOf(),
                        value: dataPoint[1],
                    };
                });
                map.set(tsData.seriesId, convertedData);
                return map;
            },
            new Map<string, DataPoint[]>()
        );
    };

    const requestDetailedData = async (currentZoom: DateBounds): Promise<void> => {
        console.log('fetch details data');
        
        if (sensorTypes) {
            console.log(currentZoom, seriesDateBounds);
            if (seriesDateBounds && seriesDateBounds.beginTime >= currentZoom.beginTime &&
                seriesDateBounds.endTime <= currentZoom.endTime) {
                // look like the user zoomed out all the way. This mean we can just use the time series
                // snapshot data and don't need to load more details data
                sensorTypes.forEach((bundle: SensorDataBundle, index: number): void => {
                    // need to create a copy of the bundle so that it is treated as new object and cause
                    // react to fire state change event
                    const updatedBundle: SensorDataBundle = Object.assign({}, bundle);
                    sensorTypes[index] = updatedBundle;
                    updatedBundle.timeSeriesData = [...updatedBundle.timeSeriesDataSnapshot];   // copy the snapshot
                });
            } else {

                // One of the charts zoomed or panned so we need to sync up other charts to have the same zoom and pan.
                // also, we need to load data for the start and end timespan
                const timeSeriesDataArray: TimeSeriesData[] = [];
                for (let seriesInfo of sensorTypes) {
                    try {
                        timeSeriesDataArray.push(await modeAPI.getTimeSeriesData(
                            homeId, seriesInfo.seriesId, currentZoom.beginDate, currentZoom.endDate
                        ));
                    } catch (error) {
                        console.log('Failed to load time series data for series id: ', seriesInfo.seriesId);
                    }
                }
                const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(
                    timeSeriesDataArray
                );

                /*
                const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(await Promise.all(
                    sensorTypes.map((bundle: SensorDataBundle): Promise<TimeSeriesData> => {
                        return modeAPI.getTimeSeriesData(
                            homeId,
                            bundle.seriesId,
                            currentZoom.beginDate,
                            currentZoom.endDate
                        );
                    })
                ));
                */

                // update the sensor bundle timeseries data
                sensorTypes.forEach((bundle: SensorDataBundle, index: number): void => {
                    let seriesData: DataPoint[] = [];
                    if (allTimeSeriesData.has(bundle.seriesId)) {
                        // NOTE: Need to create temp and check for null so that compiler doesn't require
                        // seriesData to be defined as DataPoint[] | undefined
                        const temp: DataPoint[] | undefined = allTimeSeriesData.get(bundle.seriesId);
                        if (temp !== undefined) {
                            seriesData = temp;
                        }
                    }

                    // need to create a copy of the bundle so that it is treated as new object and cause
                    // react to fire state change event
                    const updatedBundle: SensorDataBundle = Object.assign({}, bundle);
                    sensorTypes[index] = updatedBundle;

                    // Insert newly loaded series data into timeSeriesDataSnapshot
                    updatedBundle.timeSeriesData = [];
                    let i: number = 0;
                    for (i = 0; i < updatedBundle.timeSeriesDataSnapshot.length; i++) {
                        let point: DataPoint = updatedBundle.timeSeriesDataSnapshot[i];
                        if (point.timestamp < currentZoom.beginTime) {
                            updatedBundle.timeSeriesData.push(point);
                        } else {
                            // found a point that is greater than the zoon area
                            break;
                        }
                    }
                    // add the newly loaded point in the middle of updatedBundle.timeSeriesData
                    seriesData.forEach((newPoint: DataPoint): void => {
                        updatedBundle.timeSeriesData.push(newPoint);
                    });
                    // Add points from snapshot that is later than the zoom end time into updatedBundle.timeSeriesData
                    for (; i < updatedBundle.timeSeriesDataSnapshot.length; i++) {
                        let point: DataPoint = updatedBundle.timeSeriesDataSnapshot[i];
                        if (point.timestamp > currentZoom.endTime) {
                            updatedBundle.timeSeriesData.push(point);
                        }
                    }
                });
            }

            setSensorTypes([...sensorTypes]);
        }
        
    };

    // the URL should contain deviceId and sensorModuleId. If not, take the user
    // back to the devices page
    if (!props.match.params.deviceId || !props.match.params.sensorModuleId) {        
        return (
            <Redirect to="/devices" />
        );
    }

    /**
     * initialize the page by loading all the required data
     */
    const initialize = async (): Promise<any> => {
        // check for NULL up here so we don't have to check for null everywhere else below
        if (!props.match.params.deviceId || !props.match.params.sensorModuleId) {
            return;
        }

        // get selected deviceId and selectedModuleId from URL params
        const sensorModuleId: string = props.match.params.sensorModuleId;
        const gateway: number = Number(props.match.params.deviceId);

        // restore login
        await AppContext.restoreLogin();

        // open new connection for refresh
        ModeConnection.openConnection(); 

        // get home id
        const home: Home = await modeAPI.getHome(ClientStorage.getItem('user-login').user.id);

        // load module data
        const moduleData: SensorModuleInterface = await modeAPI.getDeviceKeyValueStore(
            gateway, `${Constants.SENSOR_MODULE_KEY_PREFIX}${sensorModuleId}`);

        // load all timeseries for the module. NOTE: getAllTimeSeriesInfo will return time series for the HOME
        // which includes time series for all other modules AND series that are for offline sensors. So we need 
        // to filter out series that don't belong to the selected sensor module AND series that are for offline
        // sensors
        let allTimeSeriesInfo: TimeSeriesInfo[] = [];
        try {
            allTimeSeriesInfo = (await modeAPI.getAllTimeSeriesInfo(home.id)).filter(
                (series: TimeSeriesInfo): boolean => {
                    const sensorType: string = series.id.split('-')[1].toUpperCase();
                    return series.id.includes(sensorModuleId) && moduleData.value.sensors.includes(sensorType);
                }
            );
        } catch (error) {
            // do nothing. This will be treated as no time series.
        }

        // for each time series, load the time series' bounds so we know when is the series' very first
        // and very last data point
        const timeSeriesBounds: TimeSeriesBounds[] = [];
        for (let series of allTimeSeriesInfo) {
            try {
                timeSeriesBounds.push(await modeAPI.getTimeSeriesBounds(home.id, series.id));
                // Only need 1 time series bounds so we can stop right away
                break;
            } catch (error) {
                console.error(error);
                break;
            }
        }

        // Find the min and max bounds comparing all the series
        let beginTime: number = moment(Date.now()).subtract(10, 'year').valueOf(); // default beginDate is 10 years ago
        let beginDate: string = moment(beginTime).toISOString();
        let endTime: number = Date.now();                                          // default endDate is today
        let endDate: string = moment(endTime).toISOString();

        timeSeriesBounds.forEach((bounds: TimeSeriesBounds): void => {
            const boundsBeginTime: number = moment(bounds.begin).valueOf();
            const boundsEndTime: number = moment(bounds.end).valueOf();

            if (!beginDate || beginTime < boundsBeginTime) {
                beginDate = bounds.begin;
                beginTime = boundsBeginTime;
            }
            if (!endDate || endTime < boundsEndTime) {
                endDate = bounds.end;
                endTime = boundsEndTime;
            }
        });

        // calculate the interval and buckets times so we can group the data points in buckets
        const interval: number =
            Math.floor((endTime - beginTime) / Constants.SNAPSHOT_CHART_MAX_DATA_POINTS);
        const firstBucketTS: number = Math.floor(beginTime - (interval / 2));

        // We have the bounds for each series so now we can request for the time series data from begin to end
        // The result for each API call is an object of TimeSeriesData. However, we are only interested in the
        // timeseries data's "data" array. So once we got the response from API call, we will convert these
        // time series data's data into an array of DataPoints so that it is easier to use.
        const timeSeriesDataArray: TimeSeriesData[] = [];
        for (let seriesInfo of allTimeSeriesInfo) {
            try {
                timeSeriesDataArray.push(await modeAPI.getTimeSeriesData(home.id, seriesInfo.id, beginDate, endDate));
            } catch (error) {
                console.log('Failed to load time series data for series id: ', seriesInfo.id);
            }
        }
        const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(timeSeriesDataArray);

        // Build an Array of SensorDataBundle for each time series
        const sensors: Array<SensorDataBundle> = [];
        allTimeSeriesInfo.forEach((series: TimeSeriesInfo) => {
            const format: string = series.id.split('-')[1];
            const sensorType: string = format.split(':')[0];
            const unit: any = determineUnit(sensorType);
            let seriesData: DataPoint[] = [];
            if (allTimeSeriesData.has(series.id)) {
                // NOTE: Need to create temp and check for null so that compiler doesn't require
                // seriesData to be defined as DataPoint[] | undefined
                const temp: DataPoint[] | undefined = allTimeSeriesData.get(series.id);
                if (temp !== undefined) {
                    seriesData = temp;
                }
            }

            // get the sum/min/max/avg values from the time series' data
            let sum: number = 0;
            let avg: number = 0;
            let minVal: number = Number.MAX_SAFE_INTEGER;
            let maxVal: number = Number.MIN_SAFE_INTEGER;
            seriesData.forEach(
                (point: DataPoint): void => {
                    sum = sum + point.value;
                    minVal = Math.min(minVal, point.value);
                    maxVal = Math.max(maxVal, point.value);
            },  0);
            avg = sum / seriesData.length;

            if (seriesData.length > Constants.SNAPSHOT_CHART_MAX_DATA_POINTS) {
                // Build an array of snapshot data for the time series. This data will be used to show the
                // chart in the scrollbar. For this data, we don't need too many data points. If the backend
                // returns too many, we need to remove some for rendering optimization
                // Here is the algorithm. lets say the date bounds/range is 1 year and the max # of data
                // points we can render is 12 then we need 1 point per month. The interval will ber 1 month.

                const dataBucket: Array<DataPoint> = 
                    new Array<DataPoint>(Constants.SNAPSHOT_CHART_MAX_DATA_POINTS);

                // Go through all the data point and take 1 point for each interval
                // Once this is done, seriesData.length should be ABOUT Constants.SNAPSHOT_CHART_MAX_DATA_POINTS
                // The length can be less depending on how the data points are spread out. If the data points
                // are not uniformly spread out then there will be less points after filtered
                seriesData.forEach((point: DataPoint, index: number): boolean => {
                    // find out which bucket this point belongs to and whether or not there is already another
                    // points in the bucket.
                    const bucketNumber: number = Math.floor((point.timestamp - firstBucketTS) / interval);
                    if (bucketNumber >= 0 &&
                        bucketNumber < dataBucket.length &&
                        dataBucket[bucketNumber] === undefined) {

                        dataBucket[bucketNumber] = point;
                        return true;
                    }
                    return false;
                });

                seriesData = dataBucket.filter((point: DataPoint): boolean => {
                    return point !== undefined;
                });
            }

            const sensorData: SensorDataBundle = {
                seriesId: series.id,
                unit: unit,
                type: sensorType,
                dateBounds: {
                    beginDate: beginDate,
                    endDate: endDate, 
                    beginTime: beginTime,
                    endTime: endTime,
                },
                timeSeriesDataSnapshot: seriesData,
                timeSeriesData: seriesData,
                chartHasFocus: false,
                avgVal: sensorType !== 'uv' ? avg.toFixed(1) : avg.toFixed(3),
                maxVal: sensorType !== 'uv' ? maxVal.toFixed(1) : maxVal.toFixed(3),
                minVal: sensorType !== 'uv' ? minVal.toFixed(1) : minVal.toFixed(3)
            };

            // remember the min/max bounds of all the data series
            setSeriesDateBounds({
                beginDate: beginDate,
                beginTime: beginTime,
                endDate: endDate,
                endTime: endTime,
            });

            // push that data to the sensors array
            sensors.push(sensorData);
        });

        // sort sensors by type
        sensors.sort((a: any, b: any) =>  {
            if (a.type < b.type) {
                return -1;
            }
            if (a.type > b.type) {
                return 1;
            }
            return 0;
        });

        setHomeId(home.id);
        setSelectedGateway(gateway);
        setSelectedModule(props.match.params.sensorModuleId);
        setSelectedSensorModuleObj(moduleData);
        setSensorTypes(sensors);

        console.log('Done initialize');
    };

    /**
     * This useEffect does not depend on any state so it will only get called once, when the component is mounted
     */
    useEffect(
        () => {
            setIsLoading(true);
            initialize().catch((error: ErrorResponse): void => {
                // Failed initialize
                console.log('Initialize failed');
            });
            console.log('After Done initialize');

            if (!componentUnmounted) {
                setIsLoading(false);
                setTSDBDataFetched(true);
            }
    },  []);

    // React hook's componentDidMount and componentDidUpdate
    useEffect(
        () => {
            componentUnmounted = false;

            /*
            if (homeId !== 0 && selectedGateway && selectedModule) {

                // fetch module data from KV store
                modeAPI.getDeviceKeyValueStore(
                    selectedGateway, `${Constants.SENSOR_MODULE_KEY_PREFIX}${selectedModule}`
                ).then((keyValueStore: KeyValueStore) => {
                    if (componentUnmounted) {
                        return;
                    }

                    setSelectedSensorModuleObj(keyValueStore);
                    
                    const moduleSensors = keyValueStore.value.sensors;
                    // set name of sensor
                    setSensorModuleName(keyValueStore.value.name);
                    // set full sensor list and quantity
                    setFullSensorList(moduleSensors);
                    setActiveSensorQuantity(moduleSensors.length);
                    // determine offline sensors
                    let sensorsOffline: any = Constants.ALPS_SENSOR_SET.filter((sensor: any): boolean => {
                        return !keyValueStore.value.sensors.includes(sensor);
                    });
                    setOfflineSensors(sensorsOffline);

                    modeAPI.getAllTimeSeriesInfo(homeId).then((tsdbInfo: TimeSeriesInfo[]) => {
                            if (componentUnmounted) {
                                return;
                            }
                            // filter response initially by selected module
                            const filteredTSDBData: any = tsdbInfo.filter((tsdbData: any): boolean => {
                                return tsdbData.id.includes(selectedModule);
                            });
                            // filter again for online sensors
                            const onlineTSDBData: any = filteredTSDBData.filter((filteredData: any): boolean => {
                                const sensorType = filteredData.id.split('-')[1].toUpperCase();
                                return moduleSensors.includes(sensorType);
                            });
                            setOfflineSensors(sensorsOffline);
                            let sensors: any = [];
                            // for online sensors, perform TSDB fetch
                            if (onlineTSDBData.length > 0 && !TSDBDataFetched) {
                                onlineTSDBData.forEach((sensor: any, index: any) => {
                                    const format = sensor.id.split('-')[1];
                                    const sType = format.split(':')[0];
                                    const unit = determineUnit(sType);
                                    if (unit !== undefined) {
                                        console.log('invoked.');
                                        performTSDBFetch(
                                            homeId, sensors, sType, sensor.id, unit, 
                                            onlineTSDBData);
                                    }
                                });
                            }
                        });
                // catch any errors in sensor module settings fetch
                }).catch((error: ErrorResponse): void => {
                    alert(`Unable to get sensor module settings because of this error '${error.message}'`);
                    console.log(error);
                });
            }
            */

            // websocket message handler for RT data
            const webSocketMessageHandler: any = {
                notify: (message: any): void => {
                    return;
                    if (componentUnmounted) {
                        return;
                    }
                    const moduleData = message;
                    // if app receives real time data, and it pertains to the selected Module:
                    if (homeId && moduleData.eventType === Constants.EVENT_REALTIME_DATA
                    && moduleData.eventData.timeSeriesData[0].seriesId.includes(selectedModule)) {
                        const wsData = moduleData.eventData.timeSeriesData;
                        let rtData: any = [];
                        let rtNumbers: any = [];
                        // for each sensor returned in the event:
                        wsData.forEach((sensor: any, index: any) => {
                            const format = sensor.seriesId.split('-')[1];
                            // if the sensor is online:
                            if (!offlineSensors.includes(format.toUpperCase())) {
                                const sType = format.split(':')[0];
                                // update the rtData object
                                rtData.push({
                                    seriesID: sensor.seriesId,
                                    type: sType,
                                    timestamp: sensor.timestamp,
                                    rtValue: sensor.value
                                });
                                rtNumbers.push({
                                    type: sType,
                                    val: sensor.value
                                });
                                // if we have gone through all RT data:
                                if (index === wsData.length - 1) {
                                    // if activeSensors already exists:
                                    if (activeSensors) {
                                        let updatedActiveArray: any = activeSensors;
                                        rtData.forEach((newSensor: any) => {
                                            // filter and check if RT data for the online sensor exists
                                            const dataExists = activeSensors.filter((onlineSensor: any): boolean => {
                                                return onlineSensor.type === newSensor.type;
                                            });
                                            // if the sensor already has previous RT data, update it
                                            if (dataExists.length === 1) {
                                                updatedActiveArray.forEach((updatedSensor: any) => {
                                                    if (updatedSensor.type === newSensor.type) {
                                                        updatedSensor.rtValue = newSensor.rtValue;
                                                    }
                                                });
                                            // otherwise just simply push to new array and update
                                            } else {
                                                updatedActiveArray.push(newSensor);
                                            }
                                        });
                                        // after loop finishes, set active sensors to updated data set 
                                        setActiveSensors(updatedActiveArray.sort((a: any, b: any) => {
                                            if (a.type < b.type) {
                                                return -1;
                                            }
                                            if (a.type > b.type) {
                                                return 1;
                                            }
                                            return 0;
                                        })); 
                                    // if this is the first RT data event, just simply sort and push data set
                                    } else {
                                        const sortedSensors = rtData.sort((a: any, b: any) => {
                                            if (a.type < b.type) {
                                                return -1;
                                            }
                                            if (a.type > b.type) {
                                                return 1;
                                            }
                                            return 0;
                                        }); 
                                        setActiveSensors(sortedSensors); // set real time data
                                    }
                                    // set global RT values for AmCharts
                                    sensorContext.actions.setRTValues(rtNumbers);   
                                }
                            }
                        });
                    }
                }
            };
            // check to see that TSDB data was fetched and set flag accordingly
            if (sensorTypes && sensorTypes.length > 0) {
                setNoTSDBData(false);
            } else {
                setNoTSDBData(true);
            }
            ModeConnection.addObserver(webSocketMessageHandler);
            // Return cleanup function to be called when the component is unmounted
            return (): void => {
                componentUnmounted = true;
                ModeConnection.removeObserver(webSocketMessageHandler);
            };
    // method invoke dependencies
    },  [homeId, activeSensors, editingModuleSettings, selectedGateway, 
        selectedModule, TSDBDataFetched, graphTimespan, graphTimespanNumeric]);

    /**
     * As the user zooming/panning the chart, we want to fetch more detailed data for the zoomed area. However,
     * for performance optimization, we don't want to fetch data too often. We want to wait until the user stop
     * zooming/panning and then load more data. Therefore, we need to use debounce to delay data fetch.
     */
    const getDetailDataDebouncer: any = debounce(requestDetailedData, Constants.CHART_DETAIL_REQUEST_DELAY_IN_MS);

    /**
     * This is the handler for when one of the charts is zoomed or panned.
     * We will load data for the zoomed range for each chart.
     */
    const onZoomAndPanHandler = async (
        target: SensorDataBundle,
        startTime: number,
        endTime: number
    ): Promise<void> => {
        if (sensorTypes) {
            const startDate: string = moment(startTime).toISOString();
            const endDate: string = moment(endTime).toISOString();

            // this will trigger state change event for sensorTypes which will cause chart props to update
            const newZoom: DateBounds = {
                beginTime: startTime,
                endTime: endTime,
                beginDate: startDate,
                endDate: endDate,
            };
            setZoom(newZoom);

            // Need to load detail data for the zoomed in area. However, don't do it right away.
            // Use debouncer to wait for some milliseconds before doing it.
            getDetailDataDebouncer(newZoom);
        }
    };

    const onChartInteractionHandler = (target: SensorDataBundle, isUserInteracting: boolean): void => {
        // The user start/end interaction with one of the charts. We will set that chart as active/inactive and set all
        // other chart as inactive
        if (sensorTypes) {
            sensorTypes.forEach((bundle: SensorDataBundle): void => {
                if (bundle.seriesId === target.seriesId) {
                    bundle.chartHasFocus = isUserInteracting;
                } else {
                    bundle.chartHasFocus = false;
                }
            });
            setSensorTypes([...sensorTypes]);
        }
    };

    // toggle modal visibility handler
    const toggleModalVisibility = () => {
        if (modalVisible) {
            setModuleSettingsVisible(false);
        }
        setModalVisible(!modalVisible);
    };
    // handler for renaming of the current sensor module
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setSensorModuleName(event.target.value);
    };
    // handler for the submission of new sensor module settings changes  
    const handleOk = (event: any) => {
        let filteredActiveSensors: any = Constants.ALPS_SENSOR_SET.filter((sensor: any): boolean => {
            // if the user does not request the sensor to be turned off
            return !offlineSensors.includes(sensor);
        });
        // perform kv updates
        if (props.match.params.deviceId) {
            const gateway = props.match.params.deviceId;
            // copy the current selected sensor module object and replace the module's name and list of sensors
            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, selectedSensorModuleObj);
            if (sensorModuleName) {
                updatedSensorModuleObj.value.name = sensorModuleName;
            }
            updatedSensorModuleObj.value.sensors = filteredActiveSensors;

            // update KV store for the device
            modeAPI.setDeviceKeyValueStore(parseInt(gateway, 10), updatedSensorModuleObj.key, updatedSensorModuleObj)
            .then((deviceResponse: any) => {
                if (componentUnmounted) {
                    return;
                }
                setEditingModuleSettings(true);
                return deviceResponse;
            }).catch((reason: any) => {
                console.error('reason', reason);
            });
            // re-render changes
            setEditingModuleSettings(false);
            // hide module settings
            setModuleSettingsVisible(false);
            // hide modal
            setModalVisible(false);
        }
    };
    // adjusting offline sensors handler
    const adjustOfflineSensors = (sensorType: string) => {
        // if offline sensors includes toggled sensor:
        if (offlineSensors.includes(sensorType)) {
            // remove it from offline sensors
            const removedSet = offlineSensors.filter((sensor: any) => {
                return sensor !== sensorType;
            });
            setOfflineSensors(removedSet);     
        } else {
            // if it doesn't, add it to offline sensors
            const addedSet: any = offlineSensors;
            addedSet.push(sensorType);
            setOfflineSensors(addedSet);
        }
    };
    // handler for toggling sensor module settings dropdown
    const toggleSensorModuleSettingsVisible = () => {
        setModuleSettingsVisible(!moduleSettingsVisible);
    };
    // handler for toggling the graph timespan dropdown
    const toggleGraphTimespan = (quantity: any, timespan: string): void => {
        const start = moment(new Date());
        let stop: any;
        if (timespan === 'real-time') {
            stop = start.subtract(1, 'minute');
        } else {
            stop = start.subtract(quantity, timespan);
        }
        let sensorSet: any = [];
        // set TSDB data flag to false
        setTSDBDataFetched(false);
        modeAPI.getHome(ClientStorage.getItem('user-login').user.id)
        .then((response: any) => {
            if (componentUnmounted) {
                return;
            }

            const homeID = response.id;
            // update the UI according to the new timespan
            if (sensorTypes !== undefined) {
                // map through active sensors and perform fetch
                sensorTypes.forEach((sensor: any, index: any) => {
                    performTSDBFetch(
                    homeID, sensorSet, sensor.type, sensor.seriesID,
                    sensorTypes[index].unit, sensorTypes, stop, start);
                });
            }
        });
        // update the UI according to the new timeframe and quantity
        setGraphTimespanNumeric(quantity);
        setGraphTimespan(timespan);
    };

    const renderModuleSettingsDropdown = () => {
        const menu = (
            <Menu>
            <Menu.Item 
                className="menu-setting-item"
            >
                <option 
                    onClick={toggleModalVisibility}
                >
                Sensor Module Settings
                </option>
            </Menu.Item>
            </Menu>
        );
        return (
            <Dropdown 
                overlay={menu} 
                className="dropdown"
                trigger={['hover']}
                placement="bottomRight"
            >
                <a className="default-timespan-value sensing-interval">
                    •••
                </a>
            </Dropdown>
        );
    };
    // render helper for graph timespan menu
    const renderGraphTimespanToggle = (): React.ReactNode => {
        const timespanSet = [];
        timespanSet.push({ quantity: 1, unit: 'minute'});
        timespanSet.push({ quantity: 15, unit: 'minutes'});
        timespanSet.push({ quantity: 1, unit: 'hour'});
        timespanSet.push({ quantity: 8, unit: 'hours'});
        timespanSet.push({ quantity: 24, unit: 'hours'});
        timespanSet.push({ quantity: 7, unit: 'days'});
        timespanSet.push({ quantity: 30, unit: 'days'});

        const menu = (
            <Menu>
                {   timespanSet.map((timespan: any, index: any) => {
                        return (
                            <Menu.Item 
                                key={index}
                                className="menu-setting-item"
                            >
                                <option 
                                    value={timespan.quantity}
                                    onClick={() => toggleGraphTimespan(
                                        timespan.unit === 'minute' ?
                                            '' : timespan.quantity, 
                                        timespan.unit === 'minute' ?
                                        'real-time' : timespan.unit)}
                                >
                                {timespan.unit === 'minute' ?
                                    'real-time' : `${timespan.quantity} ${timespan.unit}`}
                                </option>
                            </Menu.Item>
                        );
                    })
                }
            </Menu>
        );
        return (
            <Dropdown overlay={menu} className="dropdown">
                <a className="default-timespan-value sensing-interval d-flex align-items-center justify-content-center">
                    {`${graphTimespanNumeric} ${graphTimespan}`}<Icon type="down" />
                </a>
            </Dropdown>
        );
    };
    // sensing interval helper method for changing timeframe of receving real-time data
    const setSensingInterval = 
        (sensorModuleObj: SensorModuleInterface | null | undefined, interval: SensingInterval): void => {
        if (selectedGateway && sensorModuleObj && interval && interval.value > 0 &&
            sensorModuleObj.value.interval !== (interval.value * interval.multiplier)) {

            const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, sensorModuleObj);
            updatedSensorModuleObj.value.interval = interval.value * interval.multiplier;
            modeAPI.setDeviceKeyValueStore(selectedGateway, sensorModuleObj.key, updatedSensorModuleObj).then(
                (status: number): void => {
                if (componentUnmounted) {
                    return;
                }

                // now update the state
                setSelectedSensorModuleObj(updatedSensorModuleObj);
            },  (error: any): void => {
                alert('Unable to update device key value store');
                console.log('Unable to update device key value store', error);
            });
        }
    };
    // render helper for sensing interval menu
    const renderSensingIntervalOptions = (sensorModuleObj: SensorModuleInterface|null|undefined): React.ReactNode => {
        if (!sensorModuleObj) {
            return null;
        }

        const intervalSet: SensingInterval[] = [];
        intervalSet.push({ value: 2, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 5, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 10, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 15, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 30, unit: 'seconds', multiplier: 1});
        intervalSet.push({ value: 1, unit: 'minutes', multiplier: 60});
        intervalSet.push({ value: 5, unit: 'minutes', multiplier: 60});
        intervalSet.push({ value: 10, unit: 'minutes', multiplier: 60});

        const menu = (
            <Menu>
                {   intervalSet.map((interval: SensingInterval, index: any) => {
                        return (
                            <Menu.Item 
                                key={index}
                                className="menu-setting-item"
                            >
                                <option 
                                    value={interval.value}
                                    onClick={() => setSensingInterval(sensorModuleObj, interval)}
                                >
                                    {interval.value} {interval.unit}
                                </option>
                            </Menu.Item>
                        );
                    })
                }
            </Menu>
        );

        let selectedInterval: SensingInterval | undefined = intervalSet.find((interval: SensingInterval): boolean => {
            return sensorModuleObj.value.interval === interval.value * interval.multiplier;
        });
        if (!selectedInterval) {
            selectedInterval = {
                value: sensorModuleObj.value.interval,
                unit: 'Seconds',
                multiplier: 1
            };
        }

        return (
            <Dropdown overlay={menu} className="dropdown">
                <a className="default-timespan-value d-flex align-items-center justify-content-center">
                    {selectedInterval.value} {selectedInterval.unit}
                    <Icon type="down" />
                </a>
            </Dropdown>
        );
    };

    return (
        <Fragment>
            <div className="module-section">
                <NavLink 
                    to="/devices"
                    className="back-button"
                >
                <img
                    src={backArrow} 
                    className="back-arrow"
                />
                Back to Hardware Overview
                </NavLink>
                <div className="module-container">
                    <div className="module-details row">
                        <div className="module-left-container col-12 col-xl-6 d-flex flex-row align-items-center">
                            <img src={sensorGeneral} />
                            <div className="info-section d-flex flex-column align-items-start justify-content-center">
                                <div className="device-name">
                                {sensorModuleName ? sensorModuleName : selectedModule}
                                </div>
                                <div className="gateway-name">Gateway name: {selectedGateway}</div>
                                <div className="sensor-model">
                                { selectedModule &&
                                    `Sensor ID: ${selectedModule.split(':')[1]}`
                                }</div>
                                <div className="sensor-model">
                                { selectedModule &&
                                    `Sensor model: ${evaluateModel(selectedModule.split(':')[0])}`
                                }</div>
                            </div>
                            <div className="dropdown-menu-container">
                                {renderModuleSettingsDropdown()}
                            </div>
                            {
                                modalVisible &&
                                // if the modal state is visible:
                                <Modal
                                    title="Sensor Module Settings"
                                    visible={modalVisible}
                                    onOk={handleOk}
                                    onCancel={toggleModalVisibility}
                                >
                                <div className="sensor-module-form">
                                    <div className="sensor-module-name">
                                        <label className="label-title">Sensor Module Name</label>
                                        <Input
                                            value={sensorModuleName}
                                            onChange={handleNameChange}
                                            placeholder={
                                                sensorModuleName ? sensorModuleName :
                                                selectedModule ? selectedModule : '' 
                                            }
                                        />
                                    </div>
                                    <div className="sensor-types">
                                        <label className="label-title">Select Types of Data to Collect</label>
                                        {
                                            sensorTypes && fullSensorList && 
                                            // if the the active sensors have been fetched:
                                            Constants.ALPS_SENSOR_SET.map((sensorType: any, index: any)  => {
                                                const displayed = sensorType.split(':')[0];
                                                return (
                                                    <Checkbox 
                                                        key={sensorType}
                                                        value={displayed}
                                                        onClick={() => adjustOfflineSensors(sensorType)}
                                                        defaultChecked={fullSensorList.includes(sensorType)}
                                                    >{displayed.replace(/_/g, ' ')}
                                                    </Checkbox>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                                </Modal>

                            }
                        </div>
                        <div className="data-cols col-12 col-xl-6 d-flex flex-row">
                            <div className="data-col">
                                <div className="data-name">Sensors Active</div>
                                <div className="data-value">{activeSensorQuantity}</div>
                            </div>
                            { selectedModule && selectedModule.split(':')[0] === '0101' &&
                            <div className="data-col">
                                <div className="data-name col-dropdown">Sensing Interval</div>
                                {renderSensingIntervalOptions(selectedSensorModuleObj)}
                            </div>
                            }
                            <div className="data-col">
                                <div className="data-name col-dropdown">Graph Timespan</div>
                                {renderGraphTimespanToggle()}
                            </div>
                        </div>
                    </div>
                    <div
                        className="sensor-graph-container"
                    >
                        { sensorTypes && sensorTypes.length > 0 ?
                            // if TSDB data exists for the active sensors:
                            sensorTypes.map((sensor: SensorDataBundle, index: any) => {
                            return (
                                <div 
                                    className="sensor-container"
                                    key={sensor.seriesId}
                                > 
                                    <div className="unit-rt-container">
                                        <div className="header">
                                            {sensor.type.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        { activeSensors && sensorTypes ?
                                        <Fragment>
                                            <div className="unit-value">
                                                {
                                                activeSensors[index] &&
                                                activeSensors[index].type === sensor.type && 
                                                activeSensors[index].rtValue ?
                                                    activeSensors[index].type === 'pressure' ?
                                                    activeSensors[index].rtValue.toFixed(1) :
                                                    activeSensors[index].rtValue.toFixed(2) :
                                                    <img src={loader} />
                                                }
                                                <span className="unit">{sensorTypes[index] && 
                                                    sensorTypes[index].unit}</span>
                                            </div>
                                            { sensorTypes[index] &&
                                            <div className="graph-info-container">
                                                <div className="sensor-insight">
                                                    Maximum: <strong>{sensorTypes[index].maxVal}</strong></div>
                                                <div className="sensor-insight">
                                                    Minimum: <strong>{sensorTypes[index].minVal}</strong></div>
                                                <div className="sensor-insight">
                                                    Average: <strong>{sensorTypes[index].avgVal}</strong></div>
                                            </div>
                                            }
                                        </Fragment>
                                        :
                                        // render loader
                                        <img src={loader} />
                                        }
                                    </div>
                                    { sensorTypes && sensorTypes[index] && TSDBDataFetched ?
                                    // if TSDB data for particular sensor exists:
                                    <Fragment>
                                        <div className="graph-container">
                                            {sensorTypes[index].timeSeriesData &&
                                                sensorTypes[index].timeSeriesData.length > 0 ?
                                            (
                                                <div>
                                                    <AmChart
                                                        TSDB={sensorTypes[index]}
                                                        identifier={sensorTypes[index].type}
                                                        timespanNumeric={graphTimespanNumeric}
                                                        timespan={graphTimespan}
                                                        zoom={zoom}
                                                        hasFocus={sensorTypes[index].chartHasFocus}
                                                        onZoomAndPan={onZoomAndPanHandler}
                                                        onFocusChanged={onChartInteractionHandler}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="sensor-data-loader">
                                                    No Data
                                                </div>
                                            )}
                                        </div> 
                                    </Fragment>
                                    :
                                    <div className="graph-container">
                                    <img src={loader} />
                                    </div>
                                    }
                                </div>
                            );
                        }) :
                        // if the response is not empty
                        isLoading ?
                        <div className="sensor-data-loader">
                            <img src={loader} />
                        </div> :
                        // if the TSDB data for the timeframe is actually empty
                        <div className="sensor-data-loader">
                            No Data
                        </div>
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    );
});

export default SensorModule;