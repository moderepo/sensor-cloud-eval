import React, { useEffect, useState, useRef, useContext } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
import { Context, context } from '../context/Context';
import { SensorDataBundle, ZoomData } from '../components/entities/SensorModule';
import { DataPoint } from './entities/API';
const debounce = require('debounce');

am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {
  // amchart chart identifier
  identifier: string;
  // time series data passed to chart
  TSDB: SensorDataBundle;
  timespanNumeric: number;
  // timespan
  timespan: string;
  zoom?: ZoomData;
  zoomEventDispatchDelay?: number;
  isUserInteracting: boolean;
  onZoomAndPan?: (target: SensorDataBundle, startTime: number, endTime: number) => any;
  onUserInteraction?: (target: SensorDataBundle, isUserInteracting: boolean) => any;
}

export const AmChart: React.FC<AmChartProps> = (props: AmChartProps) => {
  // expanded or closed mode state
  const [expandedMode, setExpandedMode] = useState<boolean>(false);
  // graph height state
  const [graphHeight, setGraphHeight] = useState<string>('300px');
  // latest real-time value state
  const [latestRTVal, setlatestRTVal] = useState();
  // latest date state
  const [latestDate, setlatestDate] = useState();
  // sensor chart state
  const [sensorChart, setSensorChart] = useState<am4charts.XYChart>();
  // declare context hook
  const sensorContext: Context = useContext(context);
  // declare useEffect hook

  const [updatingData, setUpdatingData] = useState<boolean>(false);

  let componentUnmounted: boolean = false;

  useEffect(() => {
    console.log('rereating chart');

    // create amChart instance with custom identifier
    const newChart: am4charts.XYChart = am4core.create(props.identifier, am4charts.XYChart);
    if (newChart.preloader) {
      newChart.preloader.disabled = true;
    }
    setSensorChart(newChart);

    var dbData: Array<DataPoint> = [];

    // if TSDB data exists
    if (props.TSDB) {
      // props.TSDB.TSDBData.data is an Array of data point in array form
      // e.g. ["2019-08-14T07:00:00Z", 47.54249999999999];
      // we need to convert them to DataPoint objects
      dbData = props.TSDB.TSDBData.data.map((sensorDataPoint: Array<any>): DataPoint => {
        return {
            date: moment(sensorDataPoint[0]).toISOString(),
            timestamp: moment(sensorDataPoint[0]).milliseconds(),
            value: sensorDataPoint[1].toFixed(2)
        };
      });
    }
    newChart.data = dbData;

    // push  new x-value axis
    let dateAxis = newChart.xAxes.push(new am4charts.DateAxis());
    // dateAxis.renderer.minGridDistance = 30;
    dateAxis.renderer.grid.template.location = 0;
    dateAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
    dateAxis.renderer.labels.template.rotation = -90;
    // format chart x axis
    dateAxis.dateFormatter = new am4core.DateFormatter();
    dateAxis.tooltipDateFormat = 'YYYY-MM-dd HH:mm:ss';
    dateAxis.keepSelection = true;
    dateAxis.min = moment(props.TSDB.beginDate).toDate().getTime();
    dateAxis.max = moment(props.TSDB.endDate).toDate().getTime();
    dateAxis.strictMinMax = true;

    newChart.dateFormatter.dateFormat = 'i';
    newChart.dateFormatter.inputDateFormat = 'i';
    // push new y-value axis
    let valueAxis = newChart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
    valueAxis.renderer.minWidth = 60;
    valueAxis.extraMin = 0.1;
    if (props.timespan === 'minute') {
      valueAxis.extraMax = 1.0;
      valueAxis.extraMin = 1.0;
    } else {
      valueAxis.extraMax = 0.2;
    }

    // format data series:
    let series: am4charts.LineSeries = newChart.series.push(new am4charts.LineSeries());
    series.name = props.TSDB.type;
    series.dataFields.dateX = 'date';
    series.dataFields.valueY = 'value';
    series.showOnInit = false;

    // format tooltip:
    series.tooltipText = '{valueY.value}';
    if (series.tooltip) {
      series.tooltip.getFillFromObject = false;
      series.tooltip.background.fill = am4core.color('#7FCBCF');
    }
    series.fill = am4core.color('#7FCBCF');
    series.stroke = am4core.color('#7FCBCF');
    series.fillOpacity = 1;

    newChart.scrollbarX = new am4charts.XYChartScrollbar();
    newChart.scrollbarX.disabled = true;
    (newChart.scrollbarX as am4charts.XYChartScrollbar).series.push(
      newChart.series.getIndex(0) as am4charts.XYSeries
    );

    let bullet1 = series.bullets.push(new am4charts.CircleBullet());
    series.heatRules.push({
      target: bullet1.circle,
      min: 2,
      max: 2,
      property: 'radius'
    });

    // format graph gradient:
    var gradient = new am4core.LinearGradient();
    gradient.addColor(newChart.colors.getIndex(0), 0.5);
    gradient.addColor(newChart.colors.getIndex(0), 0);
    // gradient.rotation = 90;
    series.fill = gradient;

    // format cursor:
    newChart.cursor = new am4charts.XYCursor();
    newChart.cursor.lineY.opacity = 0;

    // graph smoothness
    // series.tensionX = 0.77;
    dateAxis.renderer.grid.template.strokeOpacity = 0.07;
    valueAxis.renderer.grid.template.strokeOpacity = 0.07;

    newChart.events.on('datavalidated', (event: any): void => {
      // on data ready, zoom the chart to the set timespan
      console.log('data validated');
    });

    return function cleanup() {
      newChart.events.off('datavalidated');
      if (newChart) {
        newChart.dispose();
      }
    };
  },        []);

  const dispatchZoomPanEvent: (event: any) => void = (event: any): void => {
    console.log('On Zoom Event - ' + props.TSDB.seriesId, updatingData);
    if (
      !componentUnmounted &&
      !updatingData &&
      props.onZoomAndPan &&
      event.target.minZoomed &&
      event.target.maxZoomed
    ) {
      props.onZoomAndPan(
        props.TSDB,
        event.target.minZoomed,
        event.target.maxZoomed
      );
    }
  };

  /**
   * This useEffect is for adding/removing scrollbar which shows the snapshot of the data series's data.
   * When the user interact with the chart, we will show the scrollbar. We will hide the scrollbar when the
   * user stop interacting with the chart
   */
  useEffect(() => {
    if (sensorChart) {
      // Enable the scroll bar when the user start interacting with the chart and disable it otherwise
      if (props.isUserInteracting) {
        sensorChart.scrollbarX.disabled = false;
      } else if (sensorChart.scrollbarX) {
        sensorChart.scrollbarX.disabled = true;
      }

      /**
       * Zoom/pan events get fired for every pixel the chart is zoomed or panned. For performance
       * optimization, we won't need to do anything until the user stop zoom/pan so we will use
       * debounce to delay the event. We won't dispatch the event until the user stoped zooming
       * or panning for props.zoomEventDispatchDelay milliseconds.
       */
      const debouncer: (event: any) => void = debounce(
        dispatchZoomPanEvent,
        props.zoomEventDispatchDelay !== undefined ? props.zoomEventDispatchDelay : 50
      );
      const dateAxis: am4charts.DateAxis = (sensorChart.xAxes.getIndex(0) as am4charts.DateAxis);
      dateAxis.events.on('startchanged', (event: any): void => {
          debouncer(event);
      });
      dateAxis.events.on('endchanged', (event: any): void => {
          debouncer(event);
      });
    }
  },        [props.isUserInteracting]);

  /**
   * This useEffect will listen to zoom state change and update the chart's zoom automatically.
   * NOTE: This will be called frequently as the user zoom/pan so need to make sure this function
   * is fast and not do anything unneccessary
   */
  useEffect(() => {
    if (sensorChart) {
      const xAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      if (!props.isUserInteracting && props.zoom && props.zoom.startTime && props.zoom.endTime) {
          xAxis.zoomToDates(moment(props.zoom.startDate).toDate(), moment(props.zoom.endDate).toDate());
      }
    }
  },        [props.zoom]);

  /**
   * this use effect will be used for listening to the data change event and update the chart data
   */
  useEffect(() => {
    // This can be called multiple times when data is updated so make sure we are not in the middle
    // of updarting chart data.
    if (!updatingData && props.TSDB && sensorChart) {
      console.log('On data changed - ' + props.TSDB.seriesId, updatingData);

      // props.TSDB.TSDBData.data is an Array of data point in array form
      // e.g. ["2019-08-14T07:00:00Z", 47.54249999999999];
      // we need to convert them to DataPoint objects
      const dbData: DataPoint[] = props.TSDB.TSDBData.data.map((sensorDataPoint: Array<any>): DataPoint => {
        return {
            date: moment(sensorDataPoint[0]).toISOString(),
            timestamp: moment(sensorDataPoint[0]).milliseconds(),
            value: sensorDataPoint[1].toFixed(2)
        };
      });
      setUpdatingData(true);
      sensorChart.data = dbData;
      setTimeout(
          (): void => {
            if (!componentUnmounted) {
              setUpdatingData(false);
            }
      },  100);
    }
  },        [props.TSDB]);

  useEffect(() => {
    // Listen to the sensorChart, timespan, and rtValues changes and update the chart
    // data but only for real-time data view
    /*
    if (
      props.timespan === 'real-time' &&
      sensorChart &&
      sensorContext.state.rtValues
    ) {
      const sData = sensorContext.state.rtValues.filter((sensor: any) => {
        return sensor.type === props.TSDB.type;
      });
      if (sData.length > 0) {
        sensorChart.removeData(1);
        sensorChart.addData({
          date: moment().toISOString(),
          value: sData[0].val.toFixed(2)
        });
      }
    }
    // invoke dependencies
    */
  },        [sensorChart, props.timespan, sensorContext.state.rtValues]);

  return (
    <div>
      <div
        onClick={(event: any) => {
          if (props.onUserInteraction) {
            props.onUserInteraction(props.TSDB, true);
          }
        }}
        id={props.identifier}
        style={{ width: '100%', height: (props.isUserInteracting ? '500px' : graphHeight) }}
      />
      {props.isUserInteracting && (
        <button
          className="compress-button"
          onClick={() => {
            if (props.onUserInteraction) {
              props.onUserInteraction(props.TSDB, false);
            }
          }}
        >
          Close
        </button>
      )}
    </div>
  );
};

export default AmChart;
