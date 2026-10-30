import { useMediaQuery } from '@mui/material';
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  AriaComponent,
  CalendarComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import type { EChartsOption } from 'echarts';

echarts.use([
  AriaComponent,
  BarChart,
  CalendarComponent,
  CanvasRenderer,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  TooltipComponent,
  VisualMapComponent,
]);

const LIGHT = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  other: '#8a8984',
  sequential: ['#dce9f9', '#2a78d6', '#123a6b'],
  text: '#52514e',
  grid: '#e4e3df',
};

const DARK = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  other: '#8a8984',
  sequential: ['#1d3a5f', '#3987e5', '#cfe2fa'],
  text: '#c3c2b7',
  grid: '#3a3a38',
};

export type ChartTheme = typeof LIGHT;

export function useChartTheme(): ChartTheme {
  return useMediaQuery('(prefers-color-scheme: dark)') ? DARK : LIGHT;
}

type Props = {
  label: string;
  option: EChartsOption;
  height?: number;
  onClick?: (params: { data?: unknown }) => void;
};

export default function Chart({ label, option, height = 280, onClick }: Props) {
  const theme = useChartTheme();
  return (
    <div role="img" aria-label={label}>
      <ReactEChartsCore
        echarts={echarts}
        notMerge
        style={{ height }}
        onEvents={onClick ? { click: onClick } : undefined}
        option={{
          backgroundColor: 'transparent',
          animation: false,
          aria: { enabled: true },
          textStyle: { color: theme.text },
          ...option,
        }}
      />
    </div>
  );
}
