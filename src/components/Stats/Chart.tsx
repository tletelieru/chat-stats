import { useTheme } from '@mui/material';
import { BarChart, HeatmapChart, LineChart } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/esm/core';
import type { EChartsOption } from 'echarts';
import { chartTheme } from '~/lib/palette';
import type { ChartTheme } from '~/lib/palette';

echarts.use([
  AriaComponent,
  BarChart,
  CanvasRenderer,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  TooltipComponent,
  VisualMapComponent,
]);

export function useChartTheme(): ChartTheme {
  return chartTheme(useTheme().palette.mode);
}

type Props = {
  label: string;
  option: EChartsOption;
  height?: number;
};

export default function Chart({ label, option, height = 280 }: Props) {
  const theme = useChartTheme();
  return (
    <div role="img" aria-label={label}>
      <ReactEChartsCore
        echarts={echarts}
        notMerge
        style={{ height }}
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
