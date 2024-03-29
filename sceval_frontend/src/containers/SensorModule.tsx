import React, { useEffect, useState, Fragment, useRef } from 'react';
import { NavLink, withRouter, RouteComponentProps, Redirect } from 'react-router-dom';
import { AmChart } from '../components/AmChart';
import { ErrorResponse, TimeSeriesData, TimeSeriesInfo, TimeSeriesBounds, DataPoint } from '../components/entities/API';
import modeAPI from '../controllers/ModeAPI';
import moment from 'moment';
import { Menu, Dropdown, Icon, Checkbox, Modal, Input } from 'antd';
import ModeConnection from '../controllers/ModeConnection';
import {
  determineUnit,
  evaluateSensorModelName,
  evaluateSensorModel,
  parseSensorModuleUUID,
  evaluateSensorModelIcon,
  parseTimeseriesId
} from '../utils/SensorTypes';
import {
  SensorModuleInterface,
  SensingInterval,
  SensorDataBundle,
  DateBounds,
  ChartTimespan as GraphTimespan,
  SensorModuleDefinition
} from '../components/entities/SensorModule';
import * as Constants from '../utils/Constants';
import { Home } from '../components/entities/API';
import { RouteParams } from '../components/entities/Routes';
import handleErrors from '../utils/ErrorMessages';
import { useCheckUserLogin, useLoadUserHome } from '../utils/CustomHooks';

import loader from '../common_images/notifications/loading_ring.svg';
import backArrow from '../common_images/navigation/back.svg';
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

interface SensorTypeSetting {
  type: string;
  name: string; // same as type but more user friendly
  selected: boolean;
}
interface SensorModuleSettings {
  name?: string;
  sensors: SensorTypeSetting[];
}

export const SensorModule = withRouter((props: SensorModuleProps & RouteComponentProps<RouteParams>) => {
  // User login info state
  const loginInfoState = useCheckUserLogin();
  // home state
  const loadHomeState = useLoadUserHome(loginInfoState.loginInfo);
  // selected module state
  const [selectedModule, setSelectedModule] = useState<string | null>();
  // sensor module data object state
  const [selectedSensorModuleObj, setSelectedSensorModuleObj] = useState<SensorModuleInterface | null>();
  // selected gateway state
  const [selectedGateway, setSelectedGateway] = useState<number>(0);
  // state to show that the page is loading so the user doesn't think it frozen
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  // state to show that we are loading chart data
  const [isLoadingTSData, setIsLoadingTSData] = useState<boolean>(true);
  // The complete list of ALL the sensor information including the inactive sensors
  const [allSensorBundles, setAllSensorBundles] = useState<SensorDataBundle[]>([]);
  // The list of active sensors
  const [activeSensorBundles, setActiveSensorBundles] = useState<SensorDataBundle[]>([]);
  // sensor module settings modal display state
  const [settingsModalVisible, setSettingsModalVisible] = useState<boolean>(false);
  // The min/max date bounds of all the sensor time series
  const [masterDateBounds, setMasterDateBounds] = useState<DateBounds>();
  // The current zoom bounds
  const [zoom, setZoom] = useState<DateBounds | undefined>();

  const [graphTimespanOptions, setGraphTimespanOptions] = useState<GraphTimespan[]>([]);

  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    fillChart: false,
    showBullets: false,
    fetchDataDelay: Constants.CHART_FETCH_DATA_DELAY_IN_MS
  });

  const [sensorModuleSettings, setSensorModuleSettings] = useState<SensorModuleSettings>();
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false);

  // to keep track of component mounted/unmounted event so we don't call set state when component is unmounted
  const componentUnmounted = useRef<boolean>(false);

  /**
   * Given an Array of TimeSeriesData objects, return the time series data in a map using time series id as keys
   * @param timeSeriesDataArray
   */
  const convertTimeSeriesDataArrayToMap = (timeSeriesDataArray: TimeSeriesData[]): Map<string, DataPoint[]> => {
    return timeSeriesDataArray.reduce((map: Map<string, DataPoint[]>, tsData: TimeSeriesData): Map<
      string,
      DataPoint[]
    > => {
      const convertedData: DataPoint[] = tsData.data.map(
        (dataPoint: Array<any>): DataPoint => {
          return {
            date: dataPoint[0],
            timestamp: moment(dataPoint[0]).valueOf(),
            value: dataPoint[1]
          };
        }
      );
      map.set(tsData.seriesId, convertedData);
      return map;
    }, new Map<string, DataPoint[]>());
  };

  /**
   * Request for detailed data for the given date bounds
   */
  const fetchDetailedData = async (
    dateBounds: DateBounds | null | undefined,
    insertToSnapshotData: boolean = true
  ): Promise<void> => {
    if (!loadHomeState.home || !dateBounds) {
      return;
    }

    setIsLoadingTSData(true);

    let updatedBundles: SensorDataBundle[] | null = null;

    if (allSensorBundles) {
      if (
        masterDateBounds &&
        masterDateBounds.beginTime === dateBounds.beginTime &&
        masterDateBounds.endTime === dateBounds.endTime
      ) {
        // If the dateBounds is exactly the same as the masterDateBounds. This mean the suer just zoomed out all
        // the way so we can just use the time serie snapshot data and don't need to load more details data
        updatedBundles = allSensorBundles.map(
          (bundle: SensorDataBundle): SensorDataBundle => {
            // need to create a copy of the bundle so that it is treated as new object and cause
            // react to fire state change event
            const updatedBundle: SensorDataBundle = Object.assign({}, bundle);
            updatedBundle.timeSeriesData = [...updatedBundle.timeSeriesDataSnapshot]; // copy the snapshot
            return updatedBundle;
          }
        );
      } else {
        // One of the charts zoomed or panned so we need to sync up other charts to have the same zoom and pan.
        // also, we need to load data for the start and end timespan
        const timeSeriesDataArray: TimeSeriesData[] = [];
        for (let sensorBundle of allSensorBundles) {
          // Only request data for active sensors. Also to avoid reloading the same data, we will make sure
          // we only load data if the the new bounds is different than the bounds we loaded previously
          if (sensorBundle.seriesId && sensorBundle.active) {
            if (
              !sensorBundle.currentDateBounds ||
              dateBounds.beginTime !== sensorBundle.currentDateBounds.beginTime ||
              dateBounds.endTime !== sensorBundle.currentDateBounds.endTime
            ) {
              try {
                timeSeriesDataArray.push(
                  await modeAPI.getTimeSeriesData(
                    loadHomeState.home.id,
                    sensorBundle.seriesId,
                    dateBounds.beginDate,
                    dateBounds.endDate
                  )
                );
              } catch (error) {
                // error
              }
            } else {
              // Requesting data for the same data, ngnoring the request
            }
          }
        }

        if (timeSeriesDataArray.length > 0) {
          // We loaded data for at least one of the series so need to add that data to the bundle it
          // belongs to

          // Convert allTimeSeriesDataArray to map of just the DataPoint array so we can look up time series
          // data by seriesId faster.
          const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(timeSeriesDataArray);

          // update the sensor bundle timeseries data
          updatedBundles = allSensorBundles.map(
            (sensorBundle: SensorDataBundle): SensorDataBundle => {
              if (!sensorBundle.seriesId || !allTimeSeriesData.has(sensorBundle.seriesId)) {
                // Sensor does not have time series id or we did not load new data for this bundle,
                // the bundle has not change so just return the same object
                return sensorBundle;
              }

              let combinedSeriesData: DataPoint[] = [];

              let loadedSeriesData: DataPoint[] | undefined = allTimeSeriesData.get(sensorBundle.seriesId);

              if (insertToSnapshotData) {
                // Insert newly loadedSeriesData into timeSeriesDataSnapshot
                let snapshot: DataPoint[] = sensorBundle.timeSeriesDataSnapshot;
                let i: number = 0;
                // Add points from snapshot that is earlier than the zoom begin time into seriesData
                for (i = 0; i < snapshot.length; i++) {
                  if (snapshot[i].timestamp < dateBounds.beginTime) {
                    combinedSeriesData.push(snapshot[i]);
                  } else {
                    // found a point that is greater than the zoom area
                    break;
                  }
                }
                // Add the newly loaded point in the seriesData
                if (loadedSeriesData) {
                  loadedSeriesData.forEach((newPoint: DataPoint): void => {
                    combinedSeriesData.push(newPoint);
                  });
                }
                // Add points from snapshot that is later than the zoom end time into seriesData
                for (; i < snapshot.length; i++) {
                  if (snapshot[i].timestamp > dateBounds.endTime) {
                    combinedSeriesData.push(snapshot[i]);
                  }
                }
              } else {
                // Don't concatenate loadedSeriesData with snap shot, replace updatedBundle.timeSeriesData
                // with the loadedSeriesData instead
                if (loadedSeriesData) {
                  combinedSeriesData = loadedSeriesData;
                }
              }

              // need to create a copy of the bundle so that it is treated as new object and cause
              // react to fire state change event
              const updatedBundle: SensorDataBundle = Object.assign({}, sensorBundle);
              // Update the current data date bounds so we know which bounds the current data belong to
              updatedBundle.currentDateBounds = Object.assign({}, dateBounds);
              updatedBundle.timeSeriesData = combinedSeriesData;
              return updatedBundle;
            }
          );
        }
      }

      if (updatedBundles !== null) {
        setAllSensorBundles(updatedBundles);
        setActiveSensorBundles(
          updatedBundles.filter((sensorBundle: SensorDataBundle): boolean => {
            return sensorBundle.active;
          })
        );
      }

      setIsLoadingTSData(false);
    }
  };

  /**
   * As the user zooming/panning the chart, we want to fetch more detailed data for the zoomed area. However,
   * for performance optimization, we don't want to fetch data too often. We want to wait until the user stop
   * zooming/panning and then load more data. Therefore, we need to use debounce to delay data fetch.
   */
  const getDetailDataDebouncer: any = debounce(fetchDetailedData, Constants.CHART_FETCH_DATA_DELAY_IN_MS);

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
      { value: Constants.YEAR_IN_MS * 10, label: 'Last 10 Years' },
      { value: Constants.YEAR_IN_MS * 5, label: 'Last 5 Years' },
      { value: Constants.YEAR_IN_MS * 2, label: 'Last 2 Years' },
      { value: Constants.YEAR_IN_MS, label: 'Last 1 Year' },
      { value: Constants.MONTH_IN_MS * 6, label: 'Last 6 Months' },
      { value: Constants.MONTH_IN_MS * 2, label: 'Last 2 Months' },
      { value: Constants.MONTH_IN_MS, label: 'Last 1 Month' },
      { value: Constants.WEEK_IN_MS * 2, label: 'Last 2 Weeks' },
      { value: Constants.WEEK_IN_MS, label: 'Last 1 Week' },
      { value: Constants.DAY_IN_MS * 2, label: 'Last 2 Days' },
      { value: Constants.DAY_IN_MS, label: 'Last 1 Day' },
      { value: Constants.HOUR_IN_MS * 12, label: 'Last 12 Hours' },
      { value: Constants.HOUR_IN_MS * 6, label: 'Last 6 Hours' },
      { value: Constants.HOUR_IN_MS * 2, label: 'Last 2 Hours' },
      { value: Constants.HOUR_IN_MS, label: 'Last 1 Hour' },
      { value: Constants.MINUTE_IN_MS * 30, label: 'Last 30 Minutes' },
      { value: Constants.MINUTE_IN_MS * 15, label: 'Last 15 Minutes' }
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
      Math.floor((50 / 100) * range)
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

    // Convert the Set to Array
    return [...Array.from(options.values())];
  };

  const initializeTimeSeries = async (
    userHome: Home,
    gateway: number,
    sensorModuleId: string,
    sensorModuleObj: SensorModuleInterface
  ) => {
    // This is the list of ACTIVE sensor types the module has
    const activeSensorTypes: string[] = sensorModuleObj.value.sensors;

    // this is the complete list of the sensor type this sensor module has, including inactive sensors
    let allSensorTypes: string[] = [];

    const sensorModel: SensorModuleDefinition | undefined = evaluateSensorModel(
      parseSensorModuleUUID(sensorModuleObj.value.id).modelId
    );
    if (sensorModel && sensorModel.moduleSchema) {
      // if we found the sensor model definition and it has a schema, use the moduleSchema to get the
      // list of all possible sensor type this module has
      allSensorTypes = sensorModel.moduleSchema;
    } else {
      // If sensor module definition is not found which mean this module is probably a CUSTOM module.
      // For CUSTOM sensor module, we store the moduleSchema in the key/value store so try to find it
      // there first. If it is not available then use "sensors" list
      if (sensorModuleObj.value.moduleSchema && sensorModuleObj.value.moduleSchema.length > 0) {
        allSensorTypes = sensorModuleObj.value.moduleSchema;
      } else {
        allSensorTypes = sensorModuleObj.value.sensors;
      }
    }

    // sort sensor types by names
    allSensorTypes.sort();

    // load all timeseries for the module. NOTE: getAllTimeSeriesInfo will return time series for the HOME
    // which includes time series for all other modules AND series that are for offline sensors. So we need
    // to filter out series that don't belong to the selected sensor module AND series that are for offline
    // sensors
    let allTimeSeriesInfo: TimeSeriesInfo[] = [];
    try {
      allTimeSeriesInfo = (await modeAPI.getAllTimeSeriesInfo(userHome.id)).filter(
        (series: TimeSeriesInfo): boolean => {
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

    // TODO - This block of code uses the GET timeRange API to get the timeseries' begin and end time.
    // However, this API might not be efficient so for now, we will use the Home's create date and today's
    // date as the timeseries's time range
    const timeSeriesBounds: TimeSeriesBounds[] = [];
    for (let seriesInfo of allTimeSeriesInfo) {
      // Only load time series bounds for ACTIVE sensor types
      if (activeSensorTypes.includes(parseTimeseriesId(seriesInfo.id, '-').sensorType.toLocaleUpperCase())) {
        try {
          timeSeriesBounds.push(await modeAPI.getTimeSeriesBounds(userHome.id, seriesInfo.id));
        } catch (error) {
          break;
        }
      }
    }

    // Find the min and max bounds of all the series. Because we need to sync up all the chart as the
    // user zoom/pan, we need to have them all use the same bounds
    let beginTime: number = Number.MAX_SAFE_INTEGER;
    let beginDate: string = '';
    let endTime: number = Number.MIN_SAFE_INTEGER;
    let endDate: string = '';

    timeSeriesBounds.forEach((bounds: TimeSeriesBounds): void => {
      const boundsBeginTime: number = moment(bounds.begin).valueOf();
      const boundsEndTime: number = moment(bounds.end).valueOf();

      if (!beginDate || beginTime > boundsBeginTime) {
        beginDate = bounds.begin;
        beginTime = boundsBeginTime;
      }
      if (!endDate || endTime < boundsEndTime) {
        endDate = bounds.end;
        endTime = boundsEndTime;
      }
    });

    // If we can't find begin/end date/time, use today
    if (!beginDate) {
      beginTime = moment(Date.now()).valueOf();
      beginDate = moment(beginTime).toISOString();
    }
    if (!endDate) {
      endTime = moment(Date.now()).valueOf();
      endDate = moment(beginTime).toISOString();
    }

    // Round the begin and end time to the nearest seconds, ignoring the milliseconds.
    beginTime = Math.floor(beginTime / 1000) * 1000;
    beginDate = moment(beginTime).toISOString();
    endTime = Math.floor(endTime / 1000) * 1000;
    endDate = moment(endTime).toISOString();

    /*
        // If calling timeRange is too expensive, we will use this block of code instead. This will
        // get the time series date range base on home's create time and now which is not very accurate
        // but good enough
        // Round the begin and end time to the nearest seconds, ignoring the milliseconds.
        let beginTime: number = moment(home.creationTime).valueOf();
        let endTime: number = Date.now();
        beginTime = Math.floor(beginTime / 1000) * 1000;
        endTime = Math.floor(endTime / 1000) * 1000;
        let beginDate: string = moment(beginTime).toISOString();
        let endDate = moment(endTime).toISOString();
        */

    // Once we know the begin and end time, we can build the list of graph timespan options the user can choose
    // We will build this list dynamically base on the range of the begin/end time because using 1 fixed list
    // of time span doesn't make sense for some data.
    const timespanOptions: GraphTimespan[] = buildGraphTimespanOptions(beginTime, endTime);

    // We have the bounds for each series so now we can request for the time series data from begin to end
    // The result for each API call is an object of TimeSeriesData. However, we are only interested in the
    // timeseries data's "data" array. So once we got the response from API call, we will convert these
    // time series data's data into an array of DataPoints so that it is easier to use.
    const timeSeriesDataArray: TimeSeriesData[] = [];
    for (let seriesInfo of allTimeSeriesInfo) {
      // Only load time series data for ACTIVE sensor types
      if (activeSensorTypes.includes(parseTimeseriesId(seriesInfo.id, '-').sensorType.toLocaleUpperCase())) {
        try {
          timeSeriesDataArray.push(await modeAPI.getTimeSeriesData(userHome.id, seriesInfo.id, beginDate, endDate));
        } catch (error) {
          // Failed to load time series data for series id
        }
      }
    }
    const allTimeSeriesData: Map<string, DataPoint[]> = convertTimeSeriesDataArrayToMap(timeSeriesDataArray);

    // We have all the data, now build an Array of SensorDataBundle for each sensor type

    // calculate the interval and buckets times so we can group the data points in buckets
    const interval: number = Math.floor((endTime - beginTime) / Constants.SNAPSHOT_CHART_MAX_DATA_POINTS);
    const firstBucketTS: number = Math.floor(beginTime - interval / 2);

    const sensors: Array<SensorDataBundle> = [];
    allSensorTypes.forEach((sensorType: string) => {
      // sensorType = acceleration_y:0 so we need to remove :0 to get the actual name
      const sensorTypeLowercase: string = sensorType.toLocaleLowerCase();
      const typeName: string = sensorTypeLowercase.split(':')[0];
      const userFriendlyName: string = typeName.replace(/_/g, ' ');
      const unit: any = determineUnit(typeName.toLowerCase());

      // NOTE: sensorModuleData.value.sensors are in uppercase
      const isActive: boolean = sensorModuleObj.value.sensors.includes(sensorType);

      // Find the time series info associated with the sensorType. NOTE: series info might not exist for a
      // sensor type if the sensor type never activated. So it is possible to have no series info. For this
      // case, just treat it as no data
      const timeSeriesInfo: TimeSeriesInfo | undefined = allTimeSeriesInfo.find(
        (seriesInfo: TimeSeriesInfo): boolean => {
          return seriesInfo.id.includes(sensorTypeLowercase);
        }
      );

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
      seriesData.forEach((point: DataPoint): void => {
        sum = sum + point.value;
        minVal = Math.min(minVal, point.value);
        maxVal = Math.max(maxVal, point.value);
      }, 0);
      avg = sum / seriesData.length;

      if (seriesData.length > Constants.SNAPSHOT_CHART_MAX_DATA_POINTS) {
        // Build an array of snapshot data for the time series. This data will be used to show the
        // chart in the scrollbar. For this data, we don't need too many data points. If the backend
        // returns too many, we need to remove some for rendering optimization
        // Here is the algorithm. lets say the date bounds/range is 1 year and the max # of data
        // points we can render is 12 then we need 1 point per month. The interval will ber 1 month.

        const dataBucket: Array<DataPoint[]> = new Array<DataPoint[]>(Constants.SNAPSHOT_CHART_MAX_DATA_POINTS);

        // Go through all the data point and compute the averge of all the points for each interval
        // Once this is done, seriesData.length should be ABOUT Constants.SNAPSHOT_CHART_MAX_DATA_POINTS
        // The length can be less depending on how the data points are spread out. If the data points
        // are not uniformly spread out then there will be less points after filtered
        seriesData.forEach((point: DataPoint, index: number): void => {
          // find out which bucket this point belongs to and whether or not there is already another
          // points in the bucket.
          const bucketNumber: number = Math.floor((point.timestamp - firstBucketTS) / interval);
          if (bucketNumber >= 0 && bucketNumber < dataBucket.length) {
            if (dataBucket[bucketNumber] === undefined) {
              // No point in bucket yet, create an array and add the point to it
              dataBucket[bucketNumber] = [point];
            } else {
              // bucket already have some point, add this point to the bucket
              dataBucket[bucketNumber].push(point);
            }
          }
        });

        // Get all the buckets that contains data and build an array of data series with the average
        // time and value of each bucket
        seriesData = dataBucket
          .filter((bucket: DataPoint[]): boolean => {
            // This will filter out buckets that don't have data
            return bucket !== undefined && bucket.length > 0;
          })
          .map(
            (bucket: DataPoint[]): DataPoint => {
              // Take the average of all the DataPoint in a bucket and return 1 DataPoint
              let timestamp: number = 0;
              let total: number = 0;
              for (let point of bucket) {
                timestamp = timestamp + point.timestamp;
                total = total + point.value;
              }
              // Take the average timestamp and round it up to the nearest SECONDS
              timestamp = Math.floor(timestamp / bucket.length / 1000) * 1000;
              return {
                timestamp: timestamp,
                date: moment(timestamp).toISOString(),
                value: Math.floor(total / bucket.length)
              };
            }
          );
      }

      const sensorData: SensorDataBundle = {
        seriesId: seriesId,
        unit: unit,
        type: sensorType,
        name: userFriendlyName,
        active: isActive,
        allTimeDateBounds: {
          beginDate: beginDate,
          endDate: endDate,
          beginTime: beginTime,
          endTime: endTime
        },
        currentDateBounds: {
          beginDate: beginDate,
          endDate: endDate,
          beginTime: beginTime,
          endTime: endTime
        },
        timeSeriesDataSnapshot: seriesData,
        timeSeriesData: seriesData,
        chartHasFocus: false,
        currentDataPoint:
          seriesData && seriesData.length > 0
            ? seriesData[seriesData.length - 1]
            : {
                date: moment(Date.now()).toISOString(),
                timestamp: Date.now(),
                value: 0
              },
        avgVal: avg,
        maxVal: maxVal,
        minVal: minVal
      };

      // push that data to the sensors array
      sensors.push(sensorData);
    });

    // remember the min/max bounds of all the data series
    setMasterDateBounds({
      beginDate: beginDate,
      beginTime: beginTime,
      endDate: endDate,
      endTime: endTime
    });

    setGraphTimespanOptions(timespanOptions);
    setAllSensorBundles(sensors);
    setActiveSensorBundles(
      sensors.filter((sensorBundle: SensorDataBundle): boolean => {
        return sensorBundle.active;
      })
    );

    // Create the sensor module settings state used for the sensor module settings modal
    setSensorModuleSettings({
      name: sensorModuleObj.value.name,
      sensors: sensors.map(
        (sensorBundle: SensorDataBundle): SensorTypeSetting => {
          return {
            type: sensorBundle.type,
            name: sensorBundle.name,
            selected: sensorBundle.active
          };
        }
      )
    });
  };

  // the URL should contain deviceId and sensorModuleId. If not, take the user
  // back to the devices page
  if (!props.match.params.deviceId || !props.match.params.sensorModuleId) {
    return <Redirect to="/devices" />;
  }

  /**
   * This useEffect does not depend on any state so it will only get called once, when the component is mounted
   * We use this to load the neccessary data which the page depends on
   */
  useEffect(() => {
    /**
     * initialize the page by loading all the required data
     */
    const initialize = async (gateway: number, sensorModuleId: string): Promise<any> => {
      // open new connection for refresh
      ModeConnection.openConnection();

      // load module data
      const sensorModuleData: SensorModuleInterface = await modeAPI.getDeviceKeyValueStore(
        gateway,
        `${Constants.SENSOR_MODULE_KEY_PREFIX}${sensorModuleId}`
      );

      setSelectedGateway(gateway);
      setSelectedModule(props.match.params.sensorModuleId);
      setSelectedSensorModuleObj(sensorModuleData);
    };

    if (loadHomeState.home && props.match.params.deviceId && props.match.params.sensorModuleId) {
      setIsLoadingPage(true);

      initialize(Number(props.match.params.deviceId), props.match.params.sensorModuleId)
        .then((): void => {
          setIsLoadingPage(false);
        })
        .catch((error: ErrorResponse): void => {
          // Failed initialize
          setIsLoadingPage(false);
        });
    }
  }, [loadHomeState.home, props.match.params.deviceId, props.match.params.sensorModuleId]);

  /**
   * Check loginInfoState for error. If there is an error, take user to login
   */
  useEffect(() => {
    if (loginInfoState.error) {
      props.history.push('/login');
    }
  }, [props.history, loginInfoState.error]);

  /**
   * This useEffected is used for loading time series data. This depends on the selectedGateway, selectedModule, etc.
   * So once those info are loaded, we can start loading time series data
   */
  useEffect(() => {
    if (loadHomeState.home && selectedGateway && selectedModule && selectedSensorModuleObj) {
      setIsLoadingTSData(true);

      initializeTimeSeries(loadHomeState.home, selectedGateway, selectedModule, selectedSensorModuleObj)
        .then(() => {
          setIsLoadingTSData(false);
        })
        .catch((error: ErrorResponse): void => {
          // Failed initialize timeseries
          setIsLoadingTSData(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadHomeState.home, selectedGateway, selectedModule, selectedSensorModuleObj]);

  // React hook's componentDidMount and componentDidUpdate
  useEffect(() => {
    componentUnmounted.current = false;

    // websocket message handler for RT data
    const webSocketMessageHandler: any = {
      notify: (message: any): void => {
        if (componentUnmounted.current) {
          return;
        }

        // if app receives real time data, and it pertains to the selected Module:
        if (
          message.eventType === Constants.EVENT_REALTIME_DATA &&
          loadHomeState.home &&
          allSensorBundles &&
          message.eventData &&
          message.eventData.timeSeriesData &&
          message.eventData.timeSeriesData.length > 0
        ) {
          // For each data point in the timeSeriesData, find out which sensor bundle it belong
          // to and add it to the associated bundle.
          let dataUpdated: boolean = false;
          message.eventData.timeSeriesData.forEach((data: any): void => {
            const sensorBundle: SensorDataBundle | undefined = allSensorBundles.find(
              (bundle: SensorDataBundle): boolean => {
                return data.seriesId === bundle.seriesId;
              }
            );

            if (sensorBundle) {
              dataUpdated = true;
              let timestamp: number = moment(data.timestamp).valueOf();
              timestamp = Math.floor(timestamp / 1000) * 1000; // round timestamp to SECONDS

              const dataPoint: DataPoint = {
                date: moment(timestamp).toISOString(),
                timestamp: timestamp,
                value: data.value
              };

              sensorBundle.currentDataPoint = dataPoint;
            }
          });

          if (dataUpdated) {
            setAllSensorBundles([...allSensorBundles]);
            setActiveSensorBundles(
              allSensorBundles.filter((bundle: SensorDataBundle): boolean => {
                return bundle.active;
              })
            );
          }
        }
      }
    };

    ModeConnection.addObserver(webSocketMessageHandler);

    // Return cleanup function to be called when the component is unmounted
    return (): void => {
      componentUnmounted.current = true;
      ModeConnection.removeObserver(webSocketMessageHandler);
    };
    // method invoke dependencies
  }, [loadHomeState.home, selectedGateway, selectedModule, allSensorBundles]);

  const onUserInteractingWithChartHandler = (targetId: string): void => {
    // cancel debounce if there is one
    getDetailDataDebouncer.clear();
  };

  /**
   * This is the handler for when one of the charts is zoomed or panned.
   * We will load data for the zoomed range for each chart.
   */
  const onZoomAndPanHandler = async (targetId: string, startTime: number, endTime: number): Promise<void> => {
    if (allSensorBundles) {
      const startDate: string = moment(startTime).toISOString();
      const endDate: string = moment(endTime).toISOString();

      // this will trigger state change event for zoom state which will cause all chart to get the new
      // zoom value and sync up the zoom level
      const newZoom: DateBounds = {
        beginTime: startTime,
        endTime: endTime,
        beginDate: startDate,
        endDate: endDate
      };
      setZoom(newZoom);

      if (!realtimeMode) {
        // Need to load detail data for the zoomed in area. However, don't do it right away.
        // Use debouncer to wait for some milliseconds before loading data because the user
        // might continue zooming/panning
        getDetailDataDebouncer(newZoom);
      }
    }
  };

  /**
   * The user start/end interaction with one of the charts. We will set that chart as active/inactive and set all
   * other chart as inactive
   * @param targetId
   * @param hasFocus
   */
  const onChartFocusHandler = (targetId: string, hasFocus: boolean): void => {
    if (allSensorBundles) {
      allSensorBundles.forEach((bundle: SensorDataBundle): void => {
        if (bundle.seriesId === targetId) {
          bundle.chartHasFocus = hasFocus;
        } else {
          bundle.chartHasFocus = false;
        }
      });
      setAllSensorBundles([...allSensorBundles]);
    }

    // cancel debounce if there is one
    getDetailDataDebouncer.clear();
  };

  /**
   * Handle sensor module name change from the sensor module settings modal.
   * Change the sensorModuleSettings state's name and update the state
   * @param event
   */
  const onSensorModuleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    if (sensorModuleSettings) {
      sensorModuleSettings.name = event.target.value;
      setSensorModuleSettings(Object.assign({}, sensorModuleSettings));
    }
  };

  /**
   * handler for the submission of new sensor module settings changes
   * @param event
   */
  const handleSaveSensorModuleSettings = async (event: any) => {
    if (selectedSensorModuleObj && sensorModuleSettings) {
      const updatedSensorModuleObject: SensorModuleInterface = Object.assign({}, selectedSensorModuleObj);

      // If the name changed, update the name
      let nameChanged: boolean = false;
      let sensorListChanged: boolean = false;
      if (sensorModuleSettings.name !== updatedSensorModuleObject.value.name) {
        if (!sensorModuleSettings.name) {
          delete updatedSensorModuleObject.value.name;
        } else {
          updatedSensorModuleObject.value.name = sensorModuleSettings.name;
        }
        nameChanged = true;
      }
      // Get the list of selected sensor types from sensorModuleSettings and update the
      // sensor module object's sensors array
      const updatedSensorsList: string[] = sensorModuleSettings.sensors
        .filter((sensorSetting: SensorTypeSetting): boolean => {
          return sensorSetting.selected;
        })
        .map((sensorSetting: SensorTypeSetting): string => {
          return sensorSetting.type;
        });

      // Check if the updatedSensorList is different from the current list. If the list is different
      // then update the list
      if (updatedSensorModuleObject.value.sensors.length === updatedSensorsList.length) {
        // the lengths are the same but that doesn't mean the list are different, we need to
        // compare the elements in both array
        if (
          updatedSensorModuleObject.value.sensors.find((sensorType: string): boolean => {
            // for each sensorType in the current sensor module object, see if the type exist in the
            // updatedSensorList. NOTE: we are doing a REVERSE of find. We return FALSE if the sensor type
            // exist in the updatedSensorList and return TRUE if not.
            return !updatedSensorsList.includes(sensorType);
          })
        ) {
          // If find returns a sensor type that mean we found a type that does not exist
          // in the updatedSensorsList
          updatedSensorModuleObject.value.sensors = updatedSensorsList;
          sensorListChanged = true;
        }
      } else {
        // The length are different which mean the lists are different
        updatedSensorModuleObject.value.sensors = updatedSensorsList;
        sensorListChanged = true;
      }

      if (nameChanged || sensorListChanged) {
        // save the settings and update the state
        // update KV store for the device
        try {
          await modeAPI.setDeviceKeyValueStore(
            selectedGateway,
            updatedSensorModuleObject.key,
            updatedSensorModuleObject
          );
          setSelectedSensorModuleObj(updatedSensorModuleObject);
          setSettingsModalVisible(false);

          // update the active and inactive sensor bundles
          if (sensorListChanged) {
            const updatedAllSensorBundles: SensorDataBundle[] = [...allSensorBundles];
            updatedAllSensorBundles.forEach((sensorBundle: SensorDataBundle): void => {
              sensorBundle.active = updatedSensorsList.includes(sensorBundle.type);
            });
            setAllSensorBundles(updatedAllSensorBundles);

            // Use the allSensorBundles to get the list of active sensor bundles
            setActiveSensorBundles(
              updatedAllSensorBundles.filter((sensorBundle: SensorDataBundle): boolean => {
                return sensorBundle.active;
              })
            );

            // Update the sensor module settings state
            setSensorModuleSettings({
              name: selectedSensorModuleObj.value.name,
              sensors: updatedAllSensorBundles.map(
                (sensorBundle: SensorDataBundle): SensorTypeSetting => {
                  return {
                    type: sensorBundle.type,
                    name: sensorBundle.name,
                    selected: sensorBundle.active
                  };
                }
              )
            });

            // Fetch data for the new selected sensors
            fetchDetailedData(zoom);
          }
        } catch (error) {
          alert(handleErrors(error && error.message ? error.message : error));
        }
      }
    }
  };

  /**
   * Toggle the sensor type from the sensor module setting modal
   * @param target
   */
  const toggleSelectedSensorType = (target: SensorTypeSetting) => {
    if (sensorModuleSettings) {
      const sensorTypeSetting: SensorTypeSetting | undefined = sensorModuleSettings.sensors.find(
        (sensor: SensorTypeSetting): boolean => {
          return sensor.type === target.type;
        }
      );
      if (sensorTypeSetting) {
        // found the setting, now toggle selected field and update the state
        sensorTypeSetting.selected = !sensorTypeSetting.selected;
        setSensorModuleSettings(Object.assign({}, sensorModuleSettings));
      }
    }
  };

  /**
   * handler for toggling the graph timespan dropdown
   * @param timespan
   */
  const selectGraphTimespan = (timespan: GraphTimespan): void => {
    if (masterDateBounds) {
      // this will trigger state change event for sensorTypes which will cause chart props to update
      const newZoom: DateBounds = {
        beginDate: moment(masterDateBounds.endTime - timespan.value).toISOString(),
        beginTime: masterDateBounds.endTime - timespan.value,
        endTime: masterDateBounds.endTime,
        endDate: moment(masterDateBounds.endTime).toISOString()
      };
      setZoom(newZoom);

      // Need to load detail data for the zoomed in area. However, don't do it right away.
      // Use debouncer to wait for some milliseconds before doing it.
      fetchDetailedData(newZoom);
    }
  };

  /**
   * Render the dropdown to show/hide sensor module settings modal.
   */
  const renderModuleSettingsDropdown = () => {
    const menu = (
      <Menu>
        <Menu.Item className="menu-setting-item">
          <option
            onClick={() => {
              setSettingsModalVisible(true);
            }}
          >
            Sensor Module Settings
          </option>
        </Menu.Item>
      </Menu>
    );
    return (
      <Dropdown overlay={menu} className="dropdown" trigger={['hover']} placement="bottomRight">
        <span className="default-timespan-value sensing-interval">•••</span>
      </Dropdown>
    );
  };

  useEffect(() => {
    if (masterDateBounds && selectedSensorModuleObj) {
      if (realtimeMode) {
        // Load time series data for the last X seconds. X seconds will depends on the module's sensing
        // interval. We don't want to show too many points or too few points therefore we need to make it based
        // on sensing interval. For example: If the sensing interval is 5 seconds and we show 1 hours, it
        // would show too many points, 720 points. And if the sensing interval is 30 minutes, show 1 hours of
        // data would be too little.
        const interval: number =
          selectedSensorModuleObj && selectedSensorModuleObj.value.interval
            ? selectedSensorModuleObj.value.interval
            : 5;

        // Calculate what the range of the data is base on the number of points we want to show and the interval
        const range: number = interval * Constants.REALTIME_CHART_MAX_DATA_POINTS * 1000;

        const endTime: number = Date.now();
        const beginTime: number = endTime - range;
        const newZoom: DateBounds = {
          beginTime: beginTime,
          beginDate: moment(beginTime).toISOString(),
          endTime: endTime,
          endDate: moment(endTime).toISOString()
        };
        // setZoom(newZoom);
        fetchDetailedData(newZoom, false);
      } else {
        setZoom(Object.assign({}, masterDateBounds));
        fetchDetailedData(masterDateBounds);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeMode, masterDateBounds]);

  /**
   * Change realtime mode to the specified value.
   * @param realtime
   */
  const changeRealtimeMode = (realtime: boolean): void => {
    setRealtimeMode(realtime);
    if (realtime) {
      // Load time series data for the last X seconds. X seconds will depends on the module's sensing
      // interval. We don't want to show too many points or too few points therefore we need to make it base
      // on sensing interval. For example: If the sensing interval is 5 seconds and we show 1 hours, it
      // would show too many points, 720 points. And if the sensing interval is 30 minutes, show 1 hours of
      // data would be too little.
      const interval: number =
        selectedSensorModuleObj && selectedSensorModuleObj.value.interval ? selectedSensorModuleObj.value.interval : 5;

      // Calculate what the range of the data is based on the number of points we want to show and the interval
      const range: number = interval * Constants.REALTIME_CHART_MAX_DATA_POINTS * 1000;

      const endTime: number = Date.now();
      const beginTime: number = endTime - range;
      const timespan: DateBounds = {
        beginTime: beginTime,
        beginDate: moment(beginTime).toISOString(),
        endTime: endTime,
        endDate: moment(endTime).toISOString()
      };
      setZoom(undefined);
      fetchDetailedData(timespan, false);
    } else {
      setZoom(undefined);
      fetchDetailedData(masterDateBounds);
    }
  };

  /**
   * Render helper for graph timespan options. There will be 2 menus. 1 menu is to switch between
   * "Real-time" and "Historic". If historic data is selected, show another menu which let the user
   * select the time span
   */
  const renderGraphTimespanToggle = (): React.ReactNode => {
    const graphTimespanMenu = (
      <Menu>
        {graphTimespanOptions.map((timespan: GraphTimespan) => {
          return (
            <Menu.Item key={timespan.value} className="menu-setting-item">
              <option onClick={() => selectGraphTimespan(timespan)}>{timespan.label}</option>
            </Menu.Item>
          );
        })}
      </Menu>
    );
    return (
      <div className="graph-timespan-options">
        <div className="realtime-options d-flex flex-column align-items-start">
          <Checkbox name="realtime-setting" checked={realtimeMode} onClick={() => changeRealtimeMode(!realtimeMode)}>
            Real-time Graph
          </Checkbox>
        </div>

        {!realtimeMode && (
          // If not showing realtime, show these options
          <div className="static-time-options d-flex flex-column align-items-end">
            <Dropdown overlay={graphTimespanMenu} className="dropdown">
              <span className="default-timespan-value d-flex align-items-center justify-content-center">
                Select Timespan <Icon type="down" />
              </span>
            </Dropdown>
          </div>
        )}
      </div>
    );
  };

  /**
   * sensing interval helper method for changing timeframe of receving real-time data
   * @param sensorModuleObj
   * @param interval
   */
  const setSensingInterval = (
    sensorModuleObj: SensorModuleInterface | null | undefined,
    interval: SensingInterval
  ): void => {
    if (
      selectedGateway &&
      sensorModuleObj &&
      interval &&
      interval.value > 0 &&
      sensorModuleObj.value.interval !== interval.value * interval.multiplier
    ) {
      const updatedSensorModuleObj: SensorModuleInterface = Object.assign({}, sensorModuleObj);
      updatedSensorModuleObj.value.interval = interval.value * interval.multiplier;
      modeAPI.setDeviceKeyValueStore(selectedGateway, sensorModuleObj.key, updatedSensorModuleObj).then(
        (status: number): void => {
          if (componentUnmounted) {
            return;
          }

          // now update the state
          setSelectedSensorModuleObj(updatedSensorModuleObj);
        },
        (error: any): void => {
          alert('Unable to update device key value store');
        }
      );
    }
  };

  /**
   * render helper for sensing interval menu
   */
  const renderSensingIntervalOptions = (sensorModuleObj: SensorModuleInterface | null | undefined): React.ReactNode => {
    if (!sensorModuleObj) {
      return null;
    }

    const intervalSet: SensingInterval[] = [
      { value: 2, unit: 'seconds', multiplier: 1 },
      { value: 5, unit: 'seconds', multiplier: 1 },
      { value: 10, unit: 'seconds', multiplier: 1 },
      { value: 15, unit: 'seconds', multiplier: 1 },
      { value: 30, unit: 'seconds', multiplier: 1 },
      { value: 1, unit: 'minutes', multiplier: 60 },
      { value: 5, unit: 'minutes', multiplier: 60 },
      { value: 10, unit: 'minutes', multiplier: 60 }
    ];

    const menu = (
      <Menu>
        {intervalSet.map((interval: SensingInterval, index: any) => {
          return (
            <Menu.Item key={index} className="menu-setting-item">
              <option value={interval.value} onClick={() => setSensingInterval(sensorModuleObj, interval)}>
                {interval.value} {interval.unit}
              </option>
            </Menu.Item>
          );
        })}
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
        <div className="default-timespan-value d-flex align-items-center justify-content-center">
          {selectedInterval.value} {selectedInterval.unit}
          <Icon type="down" />
        </div>
      </Dropdown>
    );
  };

  /**
   * Render the graph options which allow the user to turn on/off some of the graph features
   * e.g. fill chart, show bullets,etc...
   */
  const renderGraphOptions = (): React.ReactNode => {
    return (
      <div className="chart-options d-flex flex-column align-items-start justify-content-start">
        <div className="chart-option d-flex flex-row align-items-start justify-content-start" key="show-gradient">
          <Checkbox
            className="chart-option"
            value={chartOptions.fillChart}
            onClick={event => {
              const newOptions: ChartOptions = Object.assign({}, chartOptions);
              newOptions.fillChart = !chartOptions.fillChart;
              setChartOptions(newOptions);
            }}
            checked={chartOptions.fillChart}
          >
            Fill Chart
          </Checkbox>
        </div>
        <div className="chart-option d-flex flex-row align-items-start justify-content-start" key="show-bullets">
          <Checkbox
            className="chart-option"
            value={chartOptions.showBullets}
            onClick={event => {
              const newOptions: ChartOptions = Object.assign({}, chartOptions);
              newOptions.showBullets = !chartOptions.showBullets;
              setChartOptions(newOptions);
            }}
            checked={chartOptions.showBullets}
          >
            Show Bullets
          </Checkbox>
        </div>
      </div>
    );
  };

  /**
   * This will render 1 sensor bundle. A sensor bundle UI includes the sensor's current value/mix/min/avg
   * and a chart
   * @param sensor
   */
  const renderSensorbundle = (sensor: SensorDataBundle): React.ReactNode => {
    if (!sensor) {
      return null;
    }
    const roundValue = (value: number, type: string, isCurVal: boolean): string => {
      if (isCurVal) {
        if (type === 'pressure') {
          return value.toFixed(1);
        }
      } else {
        if (type === 'uv') {
          return value.toFixed(3);
        }
        return value.toFixed(1);
      }
      return value.toFixed(2); // default
    };

    return (
      <div className="sensor-container" key={sensor.seriesId ? sensor.seriesId : sensor.type}>
        <div className="unit-rt-container">
          <div className="header">{sensor.name.toUpperCase()}</div>
          <Fragment>
            <div className="unit-value">
              {roundValue(sensor.currentDataPoint.value, sensor.name, true)}
              <span className="unit">{sensor.unit}</span>
            </div>
            <div className="graph-info-container">
              <div className="sensor-insight">
                Maximum: <strong>{roundValue(sensor.maxVal, sensor.name, false)}</strong>
              </div>
              <div className="sensor-insight">
                Minimum: <strong>{roundValue(sensor.minVal, sensor.name, false)}</strong>
              </div>
              <div className="sensor-insight">
                Average: <strong>{roundValue(sensor.avgVal, sensor.name, false)}</strong>
              </div>
            </div>
          </Fragment>
        </div>
        {sensor.seriesId && sensor.timeSeriesData ? (
          // if TSDB data for particular sensor exists, display chart
          <Fragment>
            <div className="graph-container">
              <AmChart
                identifier={sensor.seriesId}
                name={sensor.name}
                zoomEventDispatchDelay={Constants.CHART_ZOOM_EVENT_DELAY_IN_MS}
                zoom={zoom}
                data={sensor.timeSeriesData}
                newDataPoint={realtimeMode ? sensor.currentDataPoint : undefined}
                dataDateBounds={realtimeMode ? sensor.currentDateBounds : sensor.allTimeDateBounds}
                isRealtime={realtimeMode}
                hasFocus={sensor.chartHasFocus}
                fillChart={chartOptions.fillChart}
                showBullets={chartOptions.showBullets}
                onUserInteracting={onUserInteractingWithChartHandler}
                onZoomAndPan={onZoomAndPanHandler}
                onFocusChanged={onChartFocusHandler}
              />
              {isLoadingTSData && (
                // If is loading details data, show an overlay on top of the chart to disable
                // the user from interacting with the chart
                <div
                  className="loading-tsdb-overlay"
                  onClick={event => {
                    event.stopPropagation();
                    event.preventDefault();
                  }}
                  onMouseDown={event => {
                    event.stopPropagation();
                    event.preventDefault();
                  }}
                >
                  <img src={loader} alt="loader spinner" />
                </div>
              )}
            </div>
          </Fragment>
        ) : (
          <div className="sensor-data-loader">No Timeseries Data</div>
        )}
      </div>
    );
  };

  const renderSensorModuleSettingsModal = (): React.ReactNode => {
    if (!sensorModuleSettings) {
      return null;
    }
    return (
      <Modal
        title="Sensor Module Settings"
        visible={settingsModalVisible}
        onOk={handleSaveSensorModuleSettings}
        onCancel={() => {
          setSettingsModalVisible(false);
        }}
      >
        <div className="sensor-module-form">
          <div className="sensor-module-name">
            <label className="label-title">Sensor Module Name</label>
            <Input
              value={sensorModuleSettings.name}
              onChange={onSensorModuleNameChange}
              placeholder={sensorModuleSettings.name ? sensorModuleSettings.name : 'Enter sensor name'}
            />
          </div>
          <div className="sensor-types">
            <label className="label-title">Select Types of Data to Collect</label>
            <div className="sensor-type-togglers row d-flex flex-row flex-wrap">
              {sensorModuleSettings.sensors.map((sensorSetting: SensorTypeSetting) => {
                return (
                  <Checkbox
                    className="sensor-type-toggler col-4"
                    key={sensorSetting.type}
                    value={sensorSetting.type}
                    onClick={() => toggleSelectedSensorType(sensorSetting)}
                    checked={sensorSetting.selected}
                  >
                    {sensorSetting.name.toUpperCase()}
                  </Checkbox>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <Fragment>
      <div className="module-section">
        <NavLink to="/devices" className="back-button">
          <img src={backArrow} className="back-arrow" alt="back arrow" />
          Back to Hardware Overview
        </NavLink>
        <div className="module-container">
          <div className="module-details row">
            {selectedModule && selectedSensorModuleObj ? (
              <Fragment>
                <div
                  className={
                    'module-left-container d-flex flex-row align-items-center' +
                    (selectedModule &&
                    evaluateSensorModelName(parseSensorModuleUUID(selectedModule).modelId).includes('OMRON')
                      ? ' extended col-12 col-xl-8'
                      : ' col-12 col-xl-6 ')
                  }
                >
                  <img
                    src={evaluateSensorModelIcon(parseSensorModuleUUID(selectedModule).modelId)}
                    alt="sensor module icon"
                  />
                  <div className={'info-section d-flex flex-column align-items-start justify-content-center'}>
                    <div className="device-name">
                      {selectedSensorModuleObj.value.name
                        ? selectedSensorModuleObj.value.name
                        : selectedSensorModuleObj.value.id}
                    </div>
                    <div className="gateway-name">Gateway name: {selectedGateway}</div>
                    <div className="sensor-model">{selectedModule && `Sensor ID: ${selectedModule.split(':')[1]}`}</div>
                    <div className="sensor-model">
                      {selectedModule &&
                        `Sensor model: ${evaluateSensorModelName(parseSensorModuleUUID(selectedModule).modelId)}`}
                    </div>
                    <div className="sensor-count">Active Sensors: {activeSensorBundles.length}</div>
                  </div>
                  <div className="dropdown-menu-container">{renderModuleSettingsDropdown()}</div>
                  {// if the modal state is visible:
                  settingsModalVisible && renderSensorModuleSettingsModal()}
                </div>
                <div
                  className={
                    'data-cols d-flex flex-row' +
                    (selectedModule &&
                    evaluateSensorModelName(parseSensorModuleUUID(selectedModule).modelId).includes('OMRON')
                      ? 'col-12 col-xl-4'
                      : 'col-12 col-xl-6 ') +
                    (isLoadingTSData ? ' disable-control' : '')
                  }
                >
                  {selectedModule && selectedModule.split(':')[0] === '0101' && (
                    <div className="data-col">
                      <div className="data-name col-dropdown">Sensing Interval</div>
                      {renderSensingIntervalOptions(selectedSensorModuleObj)}
                    </div>
                  )}
                  <div className="data-col">
                    <div className="data-name col-dropdown">Graph Timespan</div>
                    {renderGraphTimespanToggle()}
                  </div>
                  <div className="data-col">
                    <div className="data-name col-dropdown">Graph Options</div>
                    {renderGraphOptions()}
                  </div>
                </div>
              </Fragment>
            ) : (
              <div className="sensor-data-loader">
                <img src={loader} alt="loader spinner" />
              </div>
            )}
          </div>

          <div className="sensor-graph-container">
            {activeSensorBundles && activeSensorBundles.length > 0 ? (
              // if TSDB data exists for the active sensors:
              activeSensorBundles.map((sensor: SensorDataBundle, index: any) => {
                return renderSensorbundle(sensor);
              })
            ) : // if TSDB data DOES NOT exists
            isLoadingPage || isLoadingTSData ? (
              <div className="sensor-data-loader">
                <img src={loader} alt="loader spinner" />
              </div>
            ) : (
              // if the TSDB data for the timeframe is actually empty
              <div className="sensor-data-loader">
                No data is available for this timeframe. To assess further, make sure your sensor-module is turned on.
                You can also try making the sensing interval shorter.
              </div>
            )}
          </div>
        </div>
      </div>
    </Fragment>
  );
});

export default SensorModule;
