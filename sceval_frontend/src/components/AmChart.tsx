import React, { useEffect, useState, useRef } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';
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

    const evaluateInterval = (timespan: string) => {
        switch (timespan) {
            case 'seconds':
                return 2000;
            case 'minute':
                return 2000 * 30;
            case 'minutes':
                return 2000 * 30;
            case 'hour':
                return 2000 * 1800;
            case 'hours': 
                return 2000 * 1800;
            case 'day':
                return 2000 * 21600;
            case 'days':
                return 2000 * 21600;
            default:
                return;
        }
    };

    useEffect(
        () => {
            const chart = am4core.create(props.identifier, am4charts.XYChart);
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
                        let interval = evaluateInterval(props.timespan);
                        setInterval(
                            // if user is selecting a time on the order of seconds or minutes:
                            // update graph in real time.
                            () => {
                                chart.removeData(1);
                                chart.addData({date: moment(new Date().toISOString()), 
                                    value: props.websocketRT.rtValue});
                                props.newWebsocketData(false);
                            },
                            interval
                        );
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
            series.fill = gradient;

            // format cursor:
            chart.cursor = new am4charts.XYCursor();
            let scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX = scrollbarX;
            // if (chart.cursor.tooltip) {
            //     chart.cursor.tooltip.getFillFromObject = false;
            //     chart.cursor.tooltip.background.fill = am4core.color('#7FCBCF');
            // }

            // format legend (currently hiding):
            // chart.legend = new am4charts.Legend();
            // chart.legend.parent = chart.plotContainer;
            // chart.legend.zIndex = 100;

            // format stroke opacity:
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
    );
};

export default AmChart;
