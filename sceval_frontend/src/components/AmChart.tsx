import React, { useEffect, useState, useRef, useContext } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
import { Context, context } from '../context/Context';
import { SensorDataBundle } from '../components/entities/SensorModule';
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
  zoomStartDate?: string;
  zoomEndDate?: string;
  onZoomAndPan?: (target: SensorDataBundle, startDate: string, endDate: string) => void;
}

interface DataPoint {
  date: string;
  value: number;
}

export const AmChart: React.FC<AmChartProps> = (props: AmChartProps) => {
  const [chart, setChart] = useState<am4charts.XYChart>();
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

  useEffect(() => {
    // create amChart instance with custom identifier
    const newChart: am4charts.XYChart = am4core.create(props.identifier, am4charts.XYChart);
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

    // format graph gradient:
    var gradient = new am4core.LinearGradient();
    gradient.addColor(newChart.colors.getIndex(0), 0.5);
    gradient.addColor(newChart.colors.getIndex(0), 0);
    // gradient.rotation = 90;
    series.fill = gradient;

    // format cursor:
    newChart.cursor = new am4charts.XYCursor();
    newChart.cursor.lineY.opacity = 0;
    newChart.scrollbarX = new am4charts.XYChartScrollbar();
    // Show the same series in the scrollbar
    (newChart.scrollbarX as am4charts.XYChartScrollbar).series.push(series);

    // graph smoothness
    // series.tensionX = 0.77;
    dateAxis.renderer.grid.template.strokeOpacity = 0.07;
    valueAxis.renderer.grid.template.strokeOpacity = 0.07;

    newChart.events.on('datavalidated', (event: any): void => {
      // on data ready, zoom the chart to the set timespan
      console.log('data validated');
    });

    const dispatchZoomPanEvent: (event: any) => void = (event: any): void => {
      console.log('On Zoom Event', updatingData);
      if (!updatingData && props.onZoomAndPan && event.target.minZoomed && event.target.maxZoomed) {
        props.onZoomAndPan(
          props.TSDB, moment(event.target.minZoomed).toISOString(),
          moment(event.target.maxZoomed).toISOString()
        );
      }
    };

    const debouncer: (event: any) => void = debounce(dispatchZoomPanEvent, 500);
    dateAxis.events.on('startchanged', (event: any): void => {
      // wait for half a second before firing zoom event
      debouncer(event);
    });
    dateAxis.events.on('endchanged', (event: any): void => {
      // wait for half a second before firing zoom event
      debouncer(event);
    });

    setChart(newChart);

    return function cleanup() {
      if (newChart) {
        newChart.dispose();
      }
    };
  },        []);

  useEffect(() => {
    // This can be called multiple times when data is updated so make sure we are not in the middle
    // of updarting chart data.
    console.log('On data changed', updatingData);
    if (!updatingData && props.TSDB && chart) {
      // props.TSDB.TSDBData.data is an Array of data point in array form
      // e.g. ["2019-08-14T07:00:00Z", 47.54249999999999];
      // we need to convert them to DataPoint objects
      const dbData: DataPoint[] = props.TSDB.TSDBData.data.map((sensorDataPoint: Array<any>): DataPoint => {
        return {
            date: moment(sensorDataPoint[0]).toISOString(),
            value: sensorDataPoint[1].toFixed(2)
        };
      });
      setUpdatingData(true);
      chart.data = dbData;
      setTimeout(
          (): void => {
            setUpdatingData(false);
      },  1000);
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
        onClick={() => {
          if (!expandedMode) {
            setExpandedMode(true);
            setGraphHeight('500px');
          }
        }}
        id={props.identifier}
        style={{ width: '100%', height: graphHeight }}
      />
      {expandedMode && (
        <button
          className="compress-button"
          onClick={() => {
            setGraphHeight('300px');
            setExpandedMode(false);
          }}
        >
          Close
        </button>
      )}
    </div>
  );
};

export default AmChart;
