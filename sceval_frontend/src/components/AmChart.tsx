import React, { useEffect, useState, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
import { ContextConsumer, Context } from '../context/Context';
am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {
    identifier: string;
    TSDB: SensorDataBundle;
    websocketRT: any;
    newWebsocketData: (value: boolean) => void;
    timespanNumeric: number;
    timespan: string;
}
interface SensorDataBundle {
    unit: string;
    type: string;
    TSDBData: TSDBDataBase;
}

interface TSDBDataBase {
    aggregation: string;
    begin: string;
    data: Array<any>;
    end: string;
    resolution: string;
    seriesId: string;
    type: string;
    unit: string;
}

export const AmChart: React.FC<AmChartProps> = (props: AmChartProps) => {
    const [expandedMode, setExpandedMode] = useState<boolean>(false);
    const [graphHeight, setGraphHeight] = useState<string>('300px');
    const [graphData, setGraphData] = useState([]);
    const [latestRTVal, setlatestRTVal] = useState();
    const [latestDate, setlatestDate] = useState();
    const [sensorChart, setSensorChart] = useState<am4charts.XYChart>();
    
    const AddRTData = (chart: am4charts.XYChart, context: Context): void => {
        let update = true;
        setInterval(
            () => {
                const sData = context.state.rtValues.filter((sensor: any) => {
                    return sensor.type === props.TSDB.type;
                });
                if (update) {
                    chart.removeData(1);
                    chart.addData({date: moment().toISOString(), 
                        value: sData[0].val.toFixed(2)});
                    update = false;
                }
            },
            2000
        );
    };

    useEffect(
        () => {
            const chart = am4core.create(props.identifier, am4charts.XYChart);
            setSensorChart(chart);
            var dbData: any = [];
            var dateArray: any = [];
            let value = 0;
            if (props.TSDB) {
                props.TSDB.TSDBData.data.map((sensorDataPoint: any, index: any) => {
                    if (!dateArray.includes(sensorDataPoint[0])) {
                        value += sensorDataPoint[2];
                        dbData.push({ date: moment(sensorDataPoint[0]).toISOString(),
                        value: sensorDataPoint[1].toFixed(2)});
                        dateArray.push(sensorDataPoint[0]);
                    }
                    if (index === props.TSDB.TSDBData.data.length - 1) {
                        setGraphData(dbData);
                        chart.data = dbData;
                    }
                });
            }

            // push  new x-value axis
            let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.minGridDistance = 30;
            dateAxis.title.text = 'Timeframe';
            dateAxis.renderer.grid.template.location = 0;
            dateAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
            dateAxis.renderer.labels.template.rotation = -90;
            // format chart x axis
            dateAxis.dateFormatter = new am4core.DateFormatter();
            chart.dateFormatter.dateFormat = 'i';
            chart.dateFormatter.inputDateFormat = 'i';
            // push new y-value axis
            let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
            valueAxis.renderer.minWidth = 60;
            valueAxis.title.text = props.TSDB.unit;
            valueAxis.extraMin = 0.1;
            if (props.timespan === 'minute') {
                valueAxis.extraMax = 1.0; 
                valueAxis.extraMin = 1.0; 
            } else {
                valueAxis.extraMax = 0.2; 
            }

            // format data series:
            let series = chart.series.push(new am4charts.LineSeries());
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
            gradient.addColor(chart.colors.getIndex(0), 0.5);
            gradient.addColor(chart.colors.getIndex(0), 0);
            // gradient.rotation = 90;
            series.fill = gradient;
            // format cursor:
            chart.cursor = new am4charts.XYCursor();
            let scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX = scrollbarX;

            // graph smoothness
            series.tensionX = 0.77;
            dateAxis.renderer.grid.template.strokeOpacity = 0.07;
            valueAxis.renderer.grid.template.strokeOpacity = 0.07;
            return function cleanup() {
                if (chart) {
                    chart.dispose();
                }   
            };
        }
        ,
        []
    );

    return (
        <ContextConsumer>
        {(context: Context) =>
          context && (
        <div>
            {
                sensorChart && props.timespan === 'real-time' &&  // add real time  data if on real-time scale
                    AddRTData(sensorChart, context)
            }
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
            { expandedMode &&
            <button
                className="compress-button"
                onClick={() => {
                    setGraphHeight('300px');
                    setExpandedMode(false);
                }}
            >
                Close
            </button>
            }
        </div>
        )
    }
    </ContextConsumer>
    );
};

export default AmChart;
