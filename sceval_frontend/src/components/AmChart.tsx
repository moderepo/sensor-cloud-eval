import React, { useEffect, useState } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
import { DateBounds } from '../components/entities/SensorModule';
import { DataPoint } from './entities/API';
import * as Constants from '../utils/Constants';
const debounce = require('debounce');

am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {
  // amchart chart identifier
  identifier: string;
  name: string;
  // time series data passed to chart
  data: DataPoint[];
  dataDateBounds: DateBounds;
  isRealtime: boolean;
  newDataPoint?: DataPoint;
  zoom?: DateBounds;
  zoomEventDispatchDelay?: number;
  hasFocus: boolean;            // Used for showing/hiding scrollbar
  fillChart?: boolean;
  showBullets?: boolean;
  onUserInteracting?: (targetId: string) => any;
  onZoomAndPan?: (targetId: string, startTime: number, endTime: number) => any;
  onFocusChanged?: (targetId: string, hasFocus: boolean) => any;
}

export const AmChart: React.FC<AmChartProps> = (props: AmChartProps) => {
  // graph height state
  const [graphHeight] = useState<string>('300px');
  // sensor chart state
  const [sensorChart, setSensorChart] = useState<am4charts.XYChart>();

  let componentUnmounted: boolean = false;

  /**
   * Dispatch userInteracting event to let the listener know the user is interacting with the chart
   * @param event 
   */
  const dispatchChartInteractionEvent = (event: any): void => {
    if (props.hasFocus && props.onUserInteracting) {
      props.onUserInteracting(props.identifier);
    }
  };

  /**
   * Dispatch a zoom event to let the listener know the chart just zoomed/panned
   * @param event 
   */
  const dispatchZoomPanEvent = (event: any): void => {
    if (
      !componentUnmounted &&
      props.hasFocus &&
      props.onZoomAndPan !== undefined &&
      event && event.target &&
      event.target.minZoomed !== undefined &&
      event.target.maxZoomed !== undefined
    ) {
      const minZoom: number = Math.floor(event.target.minZoomed / 1000) * 1000;
      const maxZoom: number = Math.floor(event.target.maxZoomed / 1000) * 1000;
      if (props.dataDateBounds && minZoom <= props.dataDateBounds.beginTime &&
        maxZoom >= props.dataDateBounds.endTime) {

        // if the user zoomed out all the way, use the props.dataDateBounds begin and end instead
        props.onZoomAndPan(
          props.identifier,
          props.dataDateBounds.beginTime,
          props.dataDateBounds.endTime
        );
      } else {
        props.onZoomAndPan(
          props.identifier,
          minZoom,
          maxZoom
        );
      }
    }
  };

  useEffect(() => {

    // create amChart instance with custom identifier
    const newChart: am4charts.XYChart = am4core.create(props.identifier, am4charts.XYChart);

    // push  new x-value axis
    const dateAxis = newChart.xAxes.push(new am4charts.DateAxis());
    // dateAxis.renderer.minGridDistance = 30;
    dateAxis.renderer.grid.template.location = 0;
    dateAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
    dateAxis.renderer.labels.template.rotation = -90;
    // format chart x axis
    dateAxis.dateFormatter = new am4core.DateFormatter();
    dateAxis.tooltipDateFormat = 'YYYY-MM-dd HH:mm:ss';
    dateAxis.keepSelection = true;

    if (props.isRealtime) {
      dateAxis.extraMax = 0.1;
    } else {
      dateAxis.extraMax = 0;
      // Force the axis to line up if the chart is not realtime chart
      dateAxis.strictMinMax = true;
    }

    newChart.dateFormatter.dateFormat = 'i';
    newChart.dateFormatter.inputDateFormat = 'i';

    // push new y-value axis
    const valueAxis = newChart.yAxes.push(new am4charts.ValueAxis());
    valueAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
    valueAxis.renderer.minWidth = 60;
    valueAxis.extraMin = 0.01;
    valueAxis.extraMax = 0.01;

    // format data series:
    const series: am4charts.LineSeries = newChart.series.push(new am4charts.LineSeries());
    series.dataFields.dateX = 'date';
    series.dataFields.valueY = 'value';

    // format tooltip:
    series.tooltipText = '{valueY.value}';
    if (series.tooltip) {
      series.tooltip.getFillFromObject = false;
      series.tooltip.background.fill = am4core.color('#7FCBCF');
    }

    series.stroke = am4core.color('#7FCBCF');
    series.strokeWidth = 3;
    series.fillOpacity = 0.3;

    // Add basic scrollbar to zoom/pan chart. We can't use the preview scrollbar because of a AMChart bug
    // which the scrollbar doesn't sync with date axis if date axis has min/max set
    // https://github.com/amcharts/amcharts4/issues/1487
    newChart.scrollbarX = new am4core.Scrollbar();
    newChart.scrollbarX.thumb.minWidth = 50;
    newChart.scrollbarX.minHeight = 20;
    newChart.scrollbarX.disabled = true;

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
      newChart.scrollbarX.disabled = true;
    });

    setSensorChart(newChart);

    return function cleanup() {
      if (newChart && !newChart.isDisposed()) {
        newChart.dispose();
      }
    };
  },        [props.isRealtime, props.identifier]);

  /**
   * This useEffect is for enabling/disabling scrollbar which shows the snapshot of the data series's data.
   * When the user starts interact with the chart, we will show the scrollbar. We will hide the scrollbar when the
   * user stop interacting with the chart
   */
  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed()) {
      
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      if (props.hasFocus) {
        sensorChart.scrollbarX.disabled = false;
      } else {
        sensorChart.scrollbarX.disabled = true;
      }

      /**
       * Zoom/pan events get fired for every pixel the chart is zoomed or panned. For performance
       * optimization, we won't need to do anything until the user stop zoom/pan so we will use
       * debouncer to delay the event. We won't dispatch the event until the user stoped zooming
       * or panning for props.zoomEventDispatchDelay milliseconds.
       */
      const dispatchEventDelay: number = props.zoomEventDispatchDelay !== undefined ?
        props.zoomEventDispatchDelay : Constants.CHART_ZOOM_EVENT_DELAY_IN_MS;

      const chartInteractionEventDebouncer: (event: any) => void = debounce(dispatchChartInteractionEvent, 10);
      const zoomPanEventDebouncer: (event: any) => void = debounce(dispatchZoomPanEvent, dispatchEventDelay);

      const onRangeChange = (event: any): void => {
        // Notify the user is intracting with the chart
        chartInteractionEventDebouncer(event);

        // Use debounce to notify that the user zoomed/panned
        zoomPanEventDebouncer(event);
      };

      // register zoom/pan events
      dateAxis.events.on('selectionextremeschanged', onRangeChange);

      return function cleanup() {
        if (!dateAxis.isDisposed()) {
          dateAxis.events.off('selectionextremeschanged', onRangeChange);
        }
      };
    } else {
      return (): void => {
        // nothing
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },        [sensorChart, props.zoomEventDispatchDelay, props.hasFocus]);

  /**
   * This useEffect will listen to zoom state change and update the chart's zoom automatically.
   * NOTE: This will be called frequently as the user zoom/pan so need to make sure this function
   * is fast and not do anything unneccessary
   */
  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed()) {
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
      const currentMinZoom: number = dateAxis.minZoomed ? Math.floor(dateAxis.minZoomed / 1000) * 1000 : 0;
      const currentMaxZoom: number = dateAxis.maxZoomed ? Math.floor(dateAxis.maxZoomed / 1000) * 1000 : 0;
      if (props.zoom && props.zoom.beginTime && props.zoom.endTime && !props.hasFocus &&
        (currentMinZoom !== props.zoom.beginTime || currentMaxZoom !== props.zoom.endTime)) {

        // When we programatically zoom the chart, it will also trigger the zoom/pan event which
        // will cause the zoomPan event from being dispatched and all other chart will be trigger
        // to zoom again which will go into an infinite loop. So we need to disable the event first
        // before we zoom.
        if (props.hasFocus) {
          dateAxis.events.disable();
        }
        dateAxis.zoomToDates(moment(props.zoom.beginDate).toDate(), moment(props.zoom.endDate).toDate(), false, true);
        dateAxis.events.enable();
      }
    }
  },        [sensorChart, props.hasFocus, props.zoom]);

  /**
   * this use effect will be used for listening to the data change event and update the chart data
   */
  useEffect(() => {
    // This can be called multiple times when data is updated so make sure we are not in the middle
    // of updarting chart data.
    if (props.data && sensorChart && !sensorChart.isDisposed()) {
      const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
  
      // update the data BUT note that this will cause the data range change which will trigger the
      // data zoom/pan event. We need to ignore those pan/zoom event so that we don't go into infinite loop
      // so we need to disable events before setting data.
      dateAxis.events.disable();

      // temporary re-enable scrollbar so that it will get re-rendered when we change data
      sensorChart.scrollbarX.disabled = false;

      // listen to data invalidated event. Once data is invalidated, we can disable the scrollbar again
      // and also re-enable date axis events
      sensorChart.events.once('datavalidated', (): void => {
        if (!props.hasFocus && sensorChart.isReady()) {
          sensorChart.scrollbarX.disabled = true;
        }
        dateAxis.events.enable();
      });

      // change chart data
      sensorChart.data = props.data;
    }
  },        [sensorChart, props.hasFocus, props.data]);

  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed() && props.dataDateBounds) {
      if (!props.isRealtime) {
        const dateAxis: am4charts.DateAxis = sensorChart.xAxes.getIndex(0) as am4charts.DateAxis;
        // set the bounds for the axis
        if (props.hasFocus) {
          dateAxis.events.disable();
        }
        dateAxis.min = props.dataDateBounds.beginTime;
        dateAxis.max = props.dataDateBounds.endTime;
        dateAxis.events.enable();
        dateAxis.invalidate();
      }
    }
  },        [sensorChart, props.isRealtime, props.hasFocus, props.dataDateBounds]);

  /**
   * This effect is used for listening to newDataPoint set to the props. If we have a newDataPoint AND if
   * the chart is a real time chart, we will add the point to the chart
   */
  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed() && sensorChart.data && props.newDataPoint && props.isRealtime) {
      // We will remove 1 data point and then add the new point. However, if there isn't many
      // data points currently, we won't remove any so that the chart don't look empty
      if (sensorChart.data.length > 10) {
        // TODO - This cause some error with the chart so disable this for now until we find out why
        sensorChart.removeData(1);
      }
      sensorChart.addData(props.newDataPoint);
    }
  },        [sensorChart, props.isRealtime, props.newDataPoint]);

  /**
   * This use effect is used for listing for the fillChart state and enable/disable line series fill accordingly
   */
  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed()) {
      const series: am4charts.XYSeries = sensorChart.series.getIndex(0) as am4charts.XYSeries;
      if (props.fillChart) {
        series.fill = am4core.color('#C6E4F2');
      } else {
        series.fill = am4core.color(undefined);
      }
      series.invalidate();
    }
  },        [sensorChart, props.fillChart]);

  /**
   * This use effect is used for listing for the showBullets state and enable/disable bullets accordingly
   */
  useEffect(() => {
    if (sensorChart && !sensorChart.isDisposed()) {
      const series: am4charts.XYSeries = sensorChart.series.getIndex(0) as am4charts.XYSeries;
      if (props.showBullets) {
        if (series.bullets.length <= 0) {
          // If have not created bullet, create it
          const bullet: am4charts.CircleBullet = series.bullets.push(new am4charts.CircleBullet());
          bullet.strokeWidth = 0;
          bullet.width = 3;
          bullet.fill = am4core.color('#7FCBCF');
        } else {
          // if bullet already created, show it
          (series.bullets.getIndex(0) as am4charts.CircleBullet).show();
        }
      } else if (series.bullets.length > 0) {
        (series.bullets.getIndex(0) as am4charts.CircleBullet).hide();
      }
      series.invalidate();
    }
  },        [sensorChart, props.showBullets]);

  return (
    <div>
      <div
        onPointerDown={(event: any) => {
          if (props.onFocusChanged) {
            props.onFocusChanged(props.identifier, true);
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
              props.onFocusChanged(props.identifier, false);
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
