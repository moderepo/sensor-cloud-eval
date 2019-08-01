import React, { useEffect, useState } from 'react';
import * as am4core from '@amcharts/amcharts4/core';
import * as am4charts from '@amcharts/amcharts4/charts';
import am4themes_animated from '@amcharts/amcharts4/themes/animated';

am4core.useTheme(am4themes_animated);

interface AmChartProps extends React.Props<any> {

}
export const AmChart: React.FC<AmChartProps> = (props: AmChartProps) => {
    const [expandedMode, setExpandedMode] = useState<boolean>(false);
    const [graphHeight, setGraphHeight] = useState<string>('200px');
    useEffect(
        () => {
            const chart =  am4core.create('amchart', am4charts.XYChart);
            // DUMMY DATA
            var data = [];
            var price1 = 1000, price2 = 1200;
            for (var i = 0; i < 360; i++) {
            price1 += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 100);
            data.push({ date1: new Date(2015, 0, i), price1: price1 });
            }
            for (var y = 0; y < 360; y++) {
            price2 += Math.round((Math.random() < 0.5 ? 1 : -1) * Math.random() * 100);
            data.push({ date2: new Date(2017, 0, y), price2: price2 });
            }
            var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis.renderer.grid.template.location = 0;
            dateAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');

            var dateAxis2 = chart.xAxes.push(new am4charts.DateAxis());
            dateAxis2.renderer.grid.template.location = 0;
            dateAxis2.renderer.labels.template.fill = am4core.color('#7FCBCF');

            var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
            // valueAxis.tooltip.disabled = true;
            valueAxis.renderer.labels.template.fill = am4core.color('#7FCBCF');

            valueAxis.renderer.minWidth = 60;

            var valueAxis2 = chart.yAxes.push(new am4charts.ValueAxis());
            // valueAxis2.tooltip.disabled = true;
            valueAxis2.renderer.grid.template.strokeDasharray = '2,3';
            valueAxis2.renderer.labels.template.fill = am4core.color('#7FCBCF');
            valueAxis2.renderer.minWidth = 60;

            var series2 = chart.series.push(new am4charts.LineSeries());
            series2.name = '2017';
            series2.dataFields.dateX = 'date2';
            series2.dataFields.valueY = 'price2';
            series2.yAxis = valueAxis2;
            series2.xAxis = dateAxis2;
            series2.tooltipText = '{valueY.value}';
            series2.fill = am4core.color('#7FCBCF');
            series2.stroke = am4core.color('#7FCBCF');

            chart.cursor = new am4charts.XYCursor();
            chart.cursor.xAxis = dateAxis2;

            var scrollbarX = new am4charts.XYChartScrollbar();
            chart.scrollbarX = scrollbarX;

            chart.legend = new am4charts.Legend();
            chart.legend.parent = chart.plotContainer;
            chart.legend.zIndex = 100;

            valueAxis2.renderer.grid.template.strokeOpacity = 0.07;
            dateAxis2.renderer.grid.template.strokeOpacity = 0.07;
            dateAxis.renderer.grid.template.strokeOpacity = 0.07;
            valueAxis.renderer.grid.template.strokeOpacity = 0.07;
            chart.data = data;
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
                id="amchart" 
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
