import React, { useEffect, useState, useRef, useContext } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
import { Context, context } from '../context/Context';
import { SensorDataBundle, DateBounds } from '../components/entities/SensorModule';
import { DataPoint } from './entities/API';
import { Constants } from '../utils/Constants';
const debounce = require('debounce');

// am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {
  // amchart chart identifier
  identifier: string;
  // time series data passed to chart
  TSDB: SensorDataBundle;
  timespanNumeric: number;
  // timespan
  timespan: string;
  zoom?: DateBounds;
  zoomEventDispatchDelay?: number;
  hasFocus: boolean;            // Used for showing/hiding scrollbar
  onZoomAndPan?: (target: SensorDataBundle, startTime: number, endTime: number) => any;
  onFocusChanged?: (target: SensorDataBundle, hasFocus: boolean) => any;
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

  let componentUnmounted: boolean = false;

  /**
   * Dispatch a zoom event to let the listener know the chart just zoomed/panned
   * @param event 
   */
  const dispatchZoomPanEvent: (event: any) => void = (event: any): void => {
    console.log('On Zoom Event Dispatch: ', {
      series_id: props.TSDB.seriesId,
      zoom: props.zoom,
    });

    if (
      !componentUnmounted &&
      props.onZoomAndPan !== undefined &&
      event && event.target &&
      event.target.minZoomed !== undefined &&
      event.target.maxZoomed !== undefined
    ) {
      // if the user zoomed out all the way, use the props.TSDB.dateBounds begin and end instead
      if (event.target.minZoomed <= props.TSDB.dateBounds.beginTime &&
        event.target.maxZoomed >= props.TSDB.dateBounds.endTime) {
        props.onZoomAndPan(
          props.TSDB,
          props.TSDB.dateBounds.beginTime,
          props.TSDB.dateBounds.endTime
        );
      } else {
        props.onZoomAndPan(
          props.TSDB,
          event.target.minZoomed,
          event.target.maxZoomed
        );
      }
    }
  };

  useEffect(() => {
    console.log('rereating chart');

    // create amChart instance with custom identifier
    const newChart: am4charts.XYChart = am4core.create(props.identifier, am4charts.XYChart);
    setSensorChart(newChart);
    newChart.data = props.TSDB.timeSeriesData;

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
    dateAxis.min = props.TSDB.dateBounds.beginTime;
    dateAxis.max = props.TSDB.dateBounds.endTime;
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

    // format tooltip:
    series.tooltipText = '{valueY.value}';
    if (series.tooltip) {
      series.tooltip.getFillFromObject = false;
      series.tooltip.background.fill = am4core.color('#7FCBCF');
    }
    series.fill = am4core.color('#7FCBCF');
    series.stroke = am4core.color('#7FCBCF');
    series.fillOpacity = 1;

    // Add a scrollbar so the user can zoom/pan but make it hiddne initially until the user click on the chart
    newChart.scrollbarX = new am4charts.XYChartScrollbar();
    (newChart.scrollbarX as am4charts.XYChartScrollbar).series.push(series);
 
    const bullet = series.bullets.push(new am4charts.Bullet());
    const square = bullet.createChild(am4core.Rectangle);
    square.width = 5;
    square.height = 5;
    square.opacity = 1;
    square.horizontalCenter = 'middle';
    square.verticalCenter = 'middle';

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

    // Listen to chart ready event and then disable the scrollbar
    // If we disable it before it is rendered, the scrollbar will be blank
    newChart.events.on('ready', (event: any): void => {
      console.log('Chart ready: ', props.TSDB.seriesId);
      newChart.scrollbarX.disabled = true;
    });

    newChart.events.on('datavalidated', (event: any): void => {
      // on data validated, we can enable events again
      dateAxis.events.enable();
    });

    /**
     * Zoom/pan events get fired for every pixel the chart is zoomed or panned. For performance
     * optimization, we won't need to do anything until the user stop zoom/pan so we will use
     * debounce to delay the event. We won't dispatch the event until the user stoped zooming
     * or panning for props.zoomEventDispatchDelay milliseconds.
     */
    const dispatchEventDelay: number = props.zoomEventDispatchDelay !== undefined ?
      props.zoomEventDispatchDelay : Constants.CHART_ZOOM_EVENT_DELAY_IN_MS;

    const zoomPanEventDebouncer: (event: any) => void = debounce(dispatchZoomPanEvent, dispatchEventDelay);
    const onRangeChange = (event: any): void => {
      zoomPanEventDebouncer(event);
    };

    // register zoom/pan events
    dateAxis.events.on('startchanged', onRangeChange, newChart);
    dateAxis.events.on('endchanged', onRangeChange, newChart);

    return function cleanup() {
      dateAxis.events.off('startchanged', onRangeChange, newChart);
      dateAxis.events.off('endchanged', onRangeChange, newChart);
      newChart.events.off('datavalidated');

      if (newChart && !newChart.isDisposed()) {
        newChart.dispose();
      }
    };
  },        []);

  /**
   * This useEffect is for enabling/disabling scrollbar which shows the snapshot of the data series's data.
   * When the user interact with the chart, we will show the scrollbar. We will hide the scrollbar when the
   * user stop interacting with the chart
   */
  useEffect(() => {
    if (sensorChart) {
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      if (props.hasFocus) {
        sensorChart.scrollbarX.disabled = false;
      } else if (sensorChart.scrollbarX) {
        sensorChart.scrollbarX.disabled = true;
      }
    }
  },        [props.hasFocus]);

  /**
   * This useEffect will listen to zoom state change and update the chart's zoom automatically.
   * NOTE: This will be called frequently as the user zoom/pan so need to make sure this function
   * is fast and not do anything unneccessary
   */
  useEffect(() => {
    if (sensorChart) {
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      if (!props.hasFocus && props.zoom && props.zoom.beginTime && props.zoom.endTime) {
        console.log('Updating zoom: ', {
          series_id: props.TSDB.seriesId,
          zoom: props.zoom,
        });

        // When we programatically zoom the chart, it will also trigger the zoom/pan event which
        // will cause the zoomPan event from being dispatched and all other chart will be trigger
        // to zoom again which will go into an infinite loop. So we need to disable the event first
        // before we zoom.
        if (props.hasFocus) {
          dateAxis.events.disable();
        }
        dateAxis.zoomToDates(moment(props.zoom.beginDate).toDate(), moment(props.zoom.endDate).toDate());
        dateAxis.events.enable();
      }
    }
  },        [props.zoom]);

  /**
   * this use effect will be used for listening to the data change event and update the chart data
   */
  useEffect(() => {
    // This can be called multiple times when data is updated so make sure we are not in the middle
    // of updarting chart data.
    if (props.TSDB && sensorChart) {
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      console.log('Updating data: ', {
        series_id: props.TSDB.seriesId,
        zoom: props.zoom,
      });
  
      // update the data BUT note that this will cause the data range change which will trigger the
      // data zoom/pan event. We need to ignore those pan/zoom event so that we don't go into infinite loop
      // so we need to disable events before setting data.
      dateAxis.events.disable();
      sensorChart.data = props.TSDB.timeSeriesData;
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
          if (props.onFocusChanged) {
            props.onFocusChanged(props.TSDB, true);
          }
        }}
        id={props.identifier}
        style={{ width: '100%', height: (props.hasFocus ? '500px' : graphHeight) }}
      />
      {props.hasFocus && (
        <button
          className="compress-button"
          onClick={() => {
            if (props.onFocusChanged) {
              props.onFocusChanged(props.TSDB, false);
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
