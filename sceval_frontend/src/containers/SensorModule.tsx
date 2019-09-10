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
import { determineUnit, evaluateSensorModelName, evaluateSensorModel, parseSensorId } from '../utils/SensorTypes';
import {
    SensorModuleInterface,
    SensingInterval,
    SensorDataBundle,
    DateBounds,
    ChartTimespan as GraphTimespan,
    SensorModelInterface
} from '../components/entities/SensorModule';
import { Constants } from '../utils/Constants';
import { Home } from '../components/entities/API';
import { RouteParams } from '../components/entities/Routes';
import { string, DateFormatter, time } from '@amcharts/amcharts4/core';
import { pointsToPath } from '@amcharts/amcharts4/.internal/core/rendering/Path';

const loader = require('../common_images/notifications/loading_ring.svg');
const sensorGeneral = require('../common_images/sensor_modules/sensor.png');
const backArrow = require('../common_images/navigation/back.svg');
const debounce = require('debounce');

// declare the SensorModuleProps interface
interface SensorModuleProps extends React.Props<any> {
    isLoggedIn: boolean;
}

interface ChartOptions {
    fillChart: boolean;
    showBullets: boolean;
    fetchDataDelay: number;
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
    const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
    // state to show that we are loading chart data
    const [isLoadingTSDB, setIsLoadingTSDB] = useState<boolean>(true);
    // quantity of active sensors
    const [activeSensorQuantity, setActiveSensorQuantity] = useState<number>(0);
    // contains data from TSDB fetch
    const [sensorTypes, setSensorTypes] = useState<SensorDataBundle[]>([]);
    const [activeSensors, setActiveSensors] = useState<SensorDataBundle[]>([]);

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

    const [graphTimespanOptions, setGraphTimespanOptions] = useState<GraphTimespan[]>([]);
    const [selectedGraphTimespan, setSelectedGraphTimespan] = useState<GraphTimespan>();

    const [chartOptions, setChartOptions] = useState<ChartOptions>({
        fillChart: false,
        showBullets: false,
        fetchDataDelay: Constants.CHART_FETCH_DATA_DELAY_IN_MS,
    });

    // to keep track of component mounted/unmounted event so we don't call set state when component is unmounted
    let componentUnmounted: boolean;

    /**
     * Given an Array of TimeSeriesData objects, return the time series data in a map using time series id as keys
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

    /**
     * Request for detailed data for the given zoomed area
     */
    const requestDetailedData = async (currentZoom: DateBounds): Promise<void> => {
        if (!currentZoom) {
            console.log('Fetch details data canceled');
            return;
        }

        console.log('Fetch details data');
        setIsLoadingTSDB(true);
        
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
                for (let sensorBundle of sensorTypes) {
                    // Only request data for active sensors
                    if (sensorBundle.seriesId && sensorBundle.active) {
                        try {
                            timeSeriesDataArray.push(await modeAPI.getTimeSeriesData(
                                homeId, sensorBundle.seriesId, currentZoom.beginDate, currentZoom.endDate
                            ));
                        } catch (error) {
                            console.log('Failed to load time series data for series id: ', sensorBundle.seriesId);
                        }
                    }
                }

                // Convert allTimeSeriesDataArray to map of just the DataPoint array so we can look up time series
                // data by seriesId faster.
                const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(
                    timeSeriesDataArray
                );

                // update the sensor bundle timeseries data
                sensorTypes.forEach((sensorBundle: SensorDataBundle, index: number): void => {
                    // Only request data for active sensors
                    if (sensorBundle.seriesId) {
                        let seriesData: DataPoint[] = [];
                        if (allTimeSeriesData.has(sensorBundle.seriesId)) {
                            // NOTE: Need to create temp and check for null so that compiler doesn't require
                            // seriesData to be defined as DataPoint[] | undefined
                            const temp: DataPoint[] | undefined = allTimeSeriesData.get(sensorBundle.seriesId);
                            if (temp !== undefined) {
                                seriesData = temp;
                            }
                        }

                        // need to create a copy of the bundle so that it is treated as new object and cause
                        // react to fire state change event
                        const updatedBundle: SensorDataBundle = Object.assign({}, sensorBundle);
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
                        // Add points from snapshot that is later than the zoom end time into
                        // updatedBundle.timeSeriesData
                        for (; i < updatedBundle.timeSeriesDataSnapshot.length; i++) {
                            let point: DataPoint = updatedBundle.timeSeriesDataSnapshot[i];
                            if (point.timestamp > currentZoom.endTime) {
                                updatedBundle.timeSeriesData.push(point);
                            }
                        }
                    }
                });
            }

            setSensorTypes([...sensorTypes]);
            setActiveSensors(sensorTypes.filter((sensorBundle: SensorDataBundle): boolean => {
                return sensorBundle.active;
            }));
            setIsLoadingTSDB(false);
        }
    };

    /**
     * Once we know the begin and end time, we can build the list of graph timespan options the user can choose
     * We will build this list dynamically base on the range of the begin/end time because using 1 fixed list
     * of time span doesn't make sense for some data. For example: If the range is 10 years, it makes more sense
     * to give the user the time span that are larger e.g. 2 year, 1 year, 6 months, 1 months.
     * Once we know the begin and end time, we can build the list of graph timespan options the user can choose
     * We will build this list dynamically base on the range of the begin/end time because using 1 fixed list
     * of time span doesn't make sense for some data. For example: If the range is 10 years, it makes more sense
     * to give the user the time span that are larger e.g. 2 year, 1 year, 6 months, 1 months.
     * 
     * @param beginTime 
     * @param endTime 
     */
    const buildGraphTimespanOptions = (beginTime: number, endTime: number): GraphTimespan[] => {
        const range: number = endTime - beginTime;

        const predefinedOptions: GraphTimespan[] = [
            { value: Constants.YEAR_IN_MS * 10, label: '10 Years' },
            { value: Constants.YEAR_IN_MS * 5, label: '5 Years' },
            { value: Constants.YEAR_IN_MS * 2, label: '2 Years' },
            { value: Constants.YEAR_IN_MS, label: '1 Year' },
            { value: Constants.MONTH_IN_MS * 6, label: '6 Months' },
            { value: Constants.MONTH_IN_MS * 2, label: '2 Months' },
            { value: Constants.MONTH_IN_MS, label: '1 Month' },
            { value: Constants.WEEK_IN_MS * 2, label: '2 Weeks' },
            { value: Constants.WEEK_IN_MS, label: '1 Week' },
            { value: Constants.DAY_IN_MS * 2, label: '2 Days' },
            { value: Constants.DAY_IN_MS, label: '1 Day' },
            { value: Constants.HOUR_IN_MS * 12, label: '12 Hours' },
            { value: Constants.HOUR_IN_MS * 6, label: '6 Hours' },
            { value: Constants.HOUR_IN_MS * 2, label: '2 Hours' },
            { value: Constants.HOUR_IN_MS, label: '1 Hour' },
            { value: Constants.MINUTE_IN_MS * 30, label: '30 Minutes' },
            { value: Constants.MINUTE_IN_MS * 15, label: '15 Minutes' },
        ];

        const options: Set<GraphTimespan> = new Set<GraphTimespan>();

        // We will try to create 5 options, 50%, 25%, 20%, 10%, 5% of the range.
        // However, these values might give odd or random timespan e.g. 7 minutes, 13 days, or 3 weeks.
        // So for each of these options, we will use the closest predefinedOptions instead of the actual
        // value. For example: if 25 % of the range is 14 Hours, we will use the 12 Hours option. Or if the
        // 10 % of the range is 25 Minutes, we will use the 15 Minutes option and so on.
        // NOTE: we use a set for the list of options because sometime 1 or more of these 5 values will
        // return the same timespan. We only need to use one.
        [
            Math.floor((5 / 100) * range),
            Math.floor((10 / 100) * range),
            Math.floor((20 / 100) * range),
            Math.floor((25 / 100) * range),
            Math.floor((50 / 100) * range),
        ].forEach((timespan: number): void => {
            // now find the closest predefinedOptions to the timespan
            let result: GraphTimespan | undefined = predefinedOptions.find((option: GraphTimespan): boolean => {
                return option.value < timespan;
            });
            if (!result) {
                // Use the last one
                result = predefinedOptions[predefinedOptions.length - 1];
            }
            options.add(result);
        });

        // Convert the Set to Array and also add the 'Real-time' option to the beginning
        return [
            { value: 0, label: 'Real-time' },
            ...Array.from(options.values())
        ];
    };

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
        const sensorModuleData: SensorModuleInterface = await modeAPI.getDeviceKeyValueStore(
            gateway, `${Constants.SENSOR_MODULE_KEY_PREFIX}${sensorModuleId}`);

        // this is the complete list of the sensor type this sensor module has, including disabled sensors
        let allSensorTypes: string[] = [];

        let sensorModel: SensorModelInterface | undefined = evaluateSensorModel(
            parseSensorId(sensorModuleData.value.id).model
        );
        if (sensorModel && sensorModel.moduleSchema) {
            // if we found the sensor model definition and it has a schema, use the moduleSchema to get the
            // list of all possible sensor type this module has
            allSensorTypes = sensorModel.moduleSchema;
        } else {
            // Use the sensor module's "sensors" array as the list of possible sensot type
            allSensorTypes = sensorModuleData.value.sensors;
        }

        // sort sensor types by names
        allSensorTypes.sort();

        // load all timeseries for the module. NOTE: getAllTimeSeriesInfo will return time series for the HOME
        // which includes time series for all other modules AND series that are for offline sensors. So we need 
        // to filter out series that don't belong to the selected sensor module AND series that are for offline
        // sensors
        let allTimeSeriesInfo: TimeSeriesInfo[] = [];
        try {
            allTimeSeriesInfo = (await modeAPI.getAllTimeSeriesInfo(home.id)).filter(
                (series: TimeSeriesInfo): boolean => {
                    const sensorType: string = series.id.split('-')[1].toUpperCase();
                    // time series id will contain the sensor module id and the sensor type e.g.
                    // 0101:28a183311676-acceleration_y:0
                    // So to find out which series belong to this sensor module, we need to check if the
                    // series.id contain sensor module id
                    return series.id.includes(sensorModuleId);
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

        // Find the min and max bounds of all the series. Because we need to sync up all the chart as the
        // user zoom/pan, we need to have them all use the same bounds
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

        // Once we know the begin and end time, we can build the list of graph timespan options the user can choose
        // We will build this list dynamically base on the range of the begin/end time because using 1 fixed list
        // of time span doesn't make sense for some data.
        let timespanOptions: GraphTimespan[] = buildGraphTimespanOptions(beginTime, endTime);

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

        // We have all the data, now build an Array of SensorDataBundle for each sensor type

        // calculate the interval and buckets times so we can group the data points in buckets
        const interval: number =
            Math.floor((endTime - beginTime) / Constants.SNAPSHOT_CHART_MAX_DATA_POINTS);
        const firstBucketTS: number = Math.floor(beginTime - (interval / 2));

        const sensors: Array<SensorDataBundle> = [];
        allSensorTypes.forEach((sensorType: string) => {
            // sensorType = acceleration_y:0 so we need to remove :0 to get the actual name
            const sensorTypeLowercase: string = sensorType.toLocaleLowerCase();
            const typeName: string = sensorTypeLowercase.split(':')[0];
            const unit: any = determineUnit(typeName.toLowerCase());

            // NOTE: sensorModuleData.value.sensors are in uppercase
            const isActive: boolean = sensorModuleData.value.sensors.includes(sensorType);

            // Find the time series info associated with the sensorType. NOTE: series info might not exist for a
            // sensor type if the sensor type never activated. So it is possible to have no series info. For this
            // case, just treat it as no data
            let timeSeriesInfo: TimeSeriesInfo | undefined = allTimeSeriesInfo.find(
                (seriesInfo: TimeSeriesInfo): boolean => {
                    return seriesInfo.id.includes(sensorTypeLowercase);
                });

            let seriesData: DataPoint[] = [];
            let seriesId: string | null = null;
            if (timeSeriesInfo) {
                seriesId = timeSeriesInfo.id;

                // NOTE: Need to create temp and check for null so that compiler doesn't require
                // seriesData to be defined as DataPoint[] | undefined
                const temp: DataPoint[] | undefined = allTimeSeriesData.get(timeSeriesInfo.id);
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
                seriesId: seriesId,
                unit: unit,
                type: typeName,
                active: isActive,
                dateBounds: {
                    beginDate: beginDate,
                    endDate: endDate, 
                    beginTime: beginTime,
                    endTime: endTime,
                },
                timeSeriesDataSnapshot: seriesData,
                timeSeriesData: seriesData,
                chartHasFocus: false,
                curVal: seriesData && seriesData.length > 0 ? seriesData[seriesData.length - 1].value : 0,
                avgVal: avg,
                maxVal: maxVal,
                minVal: minVal
            };

            // push that data to the sensors array
            sensors.push(sensorData);
        });

        setHomeId(home.id);
        setSelectedGateway(gateway);
        setSelectedModule(props.match.params.sensorModuleId);
        setSelectedSensorModuleObj(sensorModuleData);

        // remember the min/max bounds of all the data series
        setSeriesDateBounds({
            beginDate: beginDate,
            beginTime: beginTime,
            endDate: endDate,
            endTime: endTime,
        });

        setGraphTimespanOptions(timespanOptions);
        setSensorTypes(sensors);
        setActiveSensors(sensors.filter((sensorBundle: SensorDataBundle): boolean => {
            return sensorBundle.active;
        }));

        setIsLoadingPage(false);
        setIsLoadingTSDB(false);
    };

    // the URL should contain deviceId and sensorModuleId. If not, take the user
    // back to the devices page
    if (!props.match.params.deviceId || !props.match.params.sensorModuleId) {        
        return (
            <Redirect to="/devices" />
        );
    }

    /**
     * This useEffect does not depend on any state so it will only get called once, when the component is mounted
     */
    useEffect(
        () => {
            setIsLoadingPage(true);
            setIsLoadingTSDB(true);

            initialize().catch((error: ErrorResponse): void => {
                // Failed initialize
                console.log('Initialize failed');
                setIsLoadingPage(false);
                setIsLoadingTSDB(false);
            });

            if (!componentUnmounted) {
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
        selectedModule, TSDBDataFetched]);

    /**
     * As the user zooming/panning the chart, we want to fetch more detailed data for the zoomed area. However,
     * for performance optimization, we don't want to fetch data too often. We want to wait until the user stop
     * zooming/panning and then load more data. Therefore, we need to use debounce to delay data fetch.
     */
    const getDetailDataDebouncer: any = debounce(requestDetailedData, Constants.CHART_FETCH_DATA_DELAY_IN_MS);

    const onUserInteractingWithChartHandler = (sensorBundle: SensorDataBundle): void => {
        // cancle debounce if there is one
        console.log('Cancel debounce');

        // Call debounce but pass zoom as null. We will check for null in the requestDetailedData function
        getDetailDataDebouncer(null);
    };

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

    /**
     * The user start/end interaction with one of the charts. We will set that chart as active/inactive and set all
     * other chart as inactive
     * @param target 
     * @param isUserInteracting 
     */
    const onChartFocusHandler = (target: SensorDataBundle, isUserInteracting: boolean): void => {
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
    const toggleGraphTimespan = (timespan: GraphTimespan): void => {
        // Don't need to update the selected timespan if it is currently set.
        if (!selectedGraphTimespan || selectedGraphTimespan.value !== timespan.value) {
            setSelectedGraphTimespan(timespan);
            if (seriesDateBounds) {
                // this will trigger state change event for sensorTypes which will cause chart props to update
                const newZoom: DateBounds = {
                    beginDate: moment(seriesDateBounds.endTime - timespan.value).toISOString(),
                    beginTime: seriesDateBounds.endTime - timespan.value,
                    endTime: seriesDateBounds.endTime,
                    endDate: moment(seriesDateBounds.endTime).toISOString()
                };
                setZoom(newZoom);

                // Need to load detail data for the zoomed in area. However, don't do it right away.
                // Use debouncer to wait for some milliseconds before doing it.
                getDetailDataDebouncer(newZoom);
            }
        }
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
        const menu = (
            <Menu>
                {   graphTimespanOptions.map((option: GraphTimespan, index: any) => {
                        return (
                            <Menu.Item 
                                key={index}
                                className="menu-setting-item"
                            >
                                <option 
                                    value={option.value}
                                    onClick={() => toggleGraphTimespan(option)}
                                >
                                    {option.label}
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
                    {selectedGraphTimespan ? selectedGraphTimespan.label : 'Select One'}<Icon type="down" />
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

        const intervalSet: SensingInterval[] = [
            { value: 2, unit: 'seconds', multiplier: 1},
            { value: 5, unit: 'seconds', multiplier: 1},
            { value: 10, unit: 'seconds', multiplier: 1},
            { value: 15, unit: 'seconds', multiplier: 1},
            { value: 30, unit: 'seconds', multiplier: 1},
            { value: 1, unit: 'minutes', multiplier: 60},
            { value: 5, unit: 'minutes', multiplier: 60},
            { value: 10, unit: 'minutes', multiplier: 60}
        ];

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

    const renderGraphOptions = (): React.ReactNode => {
        return (
            <div className="chart-options d-flex flex-column align-items-start justify-content-start">
                <div
                    className="chart-option d-flex flex-row align-items-start justify-content-start"
                    key="show-gradient"
                >
                    <label>
                        <input
                            type="checkbox"
                            checked={chartOptions.fillChart}
                            onChange={(event) => {
                                let newOptions: ChartOptions = Object.assign({}, chartOptions);
                                newOptions.fillChart = !chartOptions.fillChart;
                                setChartOptions(newOptions);
                            }}
                        />Fill Chart
                    </label>
                </div>
                <div
                    className="chart-option d-flex flex-row align-items-start justify-content-start"
                    key="show-bullets"
                >
                    <label>
                        <input
                            type="checkbox"
                            checked={chartOptions.showBullets}
                            onChange={(event) => {
                                let newOptions: ChartOptions = Object.assign({}, chartOptions);
                                newOptions.showBullets = !chartOptions.showBullets;
                                setChartOptions(newOptions);
                            }}
                        />Show Bullets
                    </label>
                </div>
            </div>
        );
    };

    const renderSensorType = (sensor: SensorDataBundle): React.ReactNode => {
        if (!sensor) {
            return null;
        }
        const roundValue = (value: number, type: string): string => {
            if (type === 'uv') {
                return value.toFixed(3);
            }
            if (type === 'pressure') {
                return value.toFixed(1);
            }            
            return value.toFixed(2);    // default
        };

        return (
            <div
                className="sensor-container"
                key={sensor.seriesId ? sensor.seriesId : sensor.type}
            > 
                <div className="unit-rt-container">
                    <div className="header">
                        {sensor.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <Fragment>
                        <div className="unit-value">
                            {roundValue(sensor.curVal, sensor.type)}
                            <span className="unit">{sensor.unit}</span>
                        </div>
                        <div className="graph-info-container">
                            <div className="sensor-insight">
                                Maximum: <strong>{roundValue(sensor.maxVal, sensor.type)}</strong></div>
                            <div className="sensor-insight">
                                Minimum: <strong>{roundValue(sensor.minVal, sensor.type)}</strong></div>
                            <div className="sensor-insight">
                                Average: <strong>{roundValue(sensor.avgVal, sensor.type)}</strong></div>
                        </div>
                    </Fragment>
                </div>
                {
                    sensor.timeSeriesData ? (
                        // if TSDB data for particular sensor exists, display chart
                        <Fragment>
                            <div className="graph-container">
                                <AmChart
                                    TSDB={sensor}
                                    identifier={sensor.type}
                                    zoomEventDispatchDelay={Constants.CHART_ZOOM_EVENT_DELAY_IN_MS}
                                    zoom={zoom}
                                    hasFocus={sensor.chartHasFocus}
                                    fillChart={chartOptions.fillChart}
                                    showBullets={chartOptions.showBullets}
                                    onUserInteracting={onUserInteractingWithChartHandler}
                                    onZoomAndPan={onZoomAndPanHandler}
                                    onFocusChanged={onChartFocusHandler}
                                />
                                {isLoadingTSDB &&
                                    // If is loading details data, show an overlay on top of the chart to disable
                                    // the user from interacting with the chart
                                    <div
                                        className="loading-tsdb-overlay"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                        }}
                                        onMouseDown={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();
                                        }}
                                    >
                                        <img src={loader} />
                                    </div>
                                }
                            </div>
                        </Fragment>                        
                    ) : (
                        <div className="sensor-data-loader">
                            No Timeseries Data
                        </div>
                    )
                }
            </div>
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
                                    `Sensor model: ${evaluateSensorModelName(selectedModule.split(':')[0])}`
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
                            <div className="data-col">
                                <div className="data-name col-dropdown">Graph Options</div>
                                {renderGraphOptions()}
                            </div>
                        </div>
                    </div>
                    <div
                        className="sensor-graph-container"
                    >
                        { activeSensors && activeSensors.length > 0 ?
                            // if TSDB data exists for the active sensors:
                            activeSensors.map((sensor: SensorDataBundle, index: any) => {
                                return renderSensorType(sensor);
                            })
                        :
                            // if the response is not empty
                            isLoadingPage ?
                            <div className="sensor-data-loader">
                                <img src={loader} />
                            </div> :
                            // if the TSDB data for the timeframe is actually empty
                            <div className="sensor-data-loader">
                                No Active Sensor
                            </div>
                        }
                    </div>
                </div>
            </div>
        </Fragment>
    );
});

export default SensorModule;