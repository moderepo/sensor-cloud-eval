import React, { useEffect, useState } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';
import moment from 'moment';

am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {
    identifier: string;
    sensorData: SensorDataBundle;
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
    const [graphHeight, setGraphHeight] = useState<string>('200px');
    useEffect(
        () => {
            const chart =  am4core.create(props.identifier, am4charts.XYChart);
            var dbData: any = [];
            var dateArray: any = [];
            let value = 1200;
            if (props.sensorData) {
                props.sensorData.TSDBData.data.map((sensorDataPoint: any) => {
                    if (!dateArray.includes(sensorDataPoint[0])) {
                        value += sensorDataPoint[2];
                        dbData.push({ date: moment(sensorDataPoint[0]).toISOString(),
                        value: sensorDataPoint[1].toFixed(2)});
                        dateArray.push(sensorDataPoint[0]);
                    }
                });
            }
            
            // push  new x-value axis
            let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.minGridDistance = 30;
            dateAxis.title.text = 'Timeframe';
            dateAxis.renderer.grid.template.location = 0;
            dateAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
            // format chart x axis
            dateAxis.dateFormatter = new am4core.DateFormatter();
            // dateAxis.dateFormats.setKey('second', '');
            chart.dateFormatter.dateFormat = 'i';
            chart.dateFormatter.inputDateFormat = 'i';
            // push new y-value axis
            let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            valueAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');
            valueAxis.renderer.minWidth = 60;

            // format data series
            let series = chart.series.push(new am4charts.LineSeries());
            series.name = props.sensorData.type;
            series.dataFields.dateX = 'date';
            series.dataFields.valueY = 'value';
            series.tooltipText = '{valueY.value}';
            series.fill = am4core.color('#7FCBCF');
            series.stroke = am4core.color('#7FCBCF');

            // format cursor
            chart.cursor = new am4charts.XYCursor();
            let scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX = scrollbarX;

            // format legend
            chart.legend = new am4charts.Legend();
            chart.legend.parent = chart.plotContainer;
            chart.legend.zIndex = 100;
            dateAxis.renderer.grid.template.strokeOpacity = 0.07;
            valueAxis.renderer.grid.template.strokeOpacity = 0.07;
            chart.data = dbData;

            return function cleanup() {
                if (chart) {
                    chart.dispose();
                }   
            };
        },
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
                    setGraphHeight('200px');
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
