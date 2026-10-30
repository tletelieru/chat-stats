import type { EChartsOption } from 'echarts';
import type { ChartTheme } from './Chart';

const MAX_SERIES = 8;
const OTHER = 'Other';

export type Series = {
  name: string;
  color: string;
  values: (number | null)[];
};

export function buildSeries(
  names: string[],
  rows: (number | null)[][],
  weights: number[],
  theme: ChartTheme,
): Series[] {
  const colors = new Map(
    names
      .map((_, person) => person)
      .sort((a, b) => weights[b] - weights[a])
      .slice(0, MAX_SERIES)
      .map((person, slot) => [person, theme.series[slot]]),
  );
  const series: Series[] = [];
  let other: (number | null)[] | null = null;

  names.forEach((name, person) => {
    const color = colors.get(person);
    if (color) series.push({ name, color, values: rows[person] });
    else {
      const base: (number | null)[] = other ?? rows[person].map(() => 0);
      other = base.map((value, index) => (value ?? 0) + (rows[person][index] ?? 0));
    }
  });

  if (other) series.push({ name: OTHER, color: theme.other, values: other });
  return series;
}

function axes(categories: string[], theme: ChartTheme): EChartsOption {
  return {
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    legend: { top: 0, type: 'scroll', textStyle: { color: theme.text } },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: theme.text },
      axisLine: { lineStyle: { color: theme.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.text },
      splitLine: { lineStyle: { color: theme.grid } },
    },
  };
}

export function stackedBars(
  categories: string[],
  series: Series[],
  theme: ChartTheme,
): EChartsOption {
  return {
    ...axes(categories, theme),
    tooltip: { trigger: 'axis' },
    series: series.map(({ name, color, values }) => ({
      name,
      type: 'bar',
      stack: 'total',
      data: values,
      itemStyle: { color, borderWidth: 1, borderColor: 'transparent' },
    })),
  };
}

export function groupedBars(
  categories: string[],
  series: Series[],
  theme: ChartTheme,
): EChartsOption {
  return {
    ...axes(categories, theme),
    tooltip: { trigger: 'axis' },
    series: series.map(({ name, color, values }) => ({
      name,
      type: 'bar',
      data: values,
      barGap: '10%',
      itemStyle: { color, borderRadius: [4, 4, 0, 0] },
    })),
  };
}

export function lines(
  categories: string[],
  series: Series[],
  theme: ChartTheme,
  format: (value: number) => string,
): EChartsOption {
  const options = axes(categories, theme);
  return {
    ...options,
    yAxis: {
      ...(options.yAxis as object),
      axisLabel: { color: theme.text, formatter: format },
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => (typeof value === 'number' ? format(value) : '–'),
    },
    series: series.map(({ name, color, values }) => ({
      name,
      type: 'line',
      data: values,
      connectNulls: true,
      symbolSize: 8,
      lineStyle: { color, width: 2 },
      itemStyle: { color },
    })),
  };
}

export function hourHeatmap(
  heat: number[],
  hours: string[],
  weekdays: string[],
  theme: ChartTheme,
): EChartsOption {
  const options = axes(hours, theme);
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 40, containLabel: true },
    tooltip: {
      formatter: (params) => {
        const [hour, day, count] = (params as { data: number[] }).data;
        return `${weekdays[day]} ${hours[hour]}:00 — ${count.toLocaleString()}`;
      },
    },
    xAxis: options.xAxis,
    yAxis: {
      type: 'category',
      data: weekdays,
      axisLabel: { color: theme.text },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    visualMap: {
      min: 0,
      max: Math.max(1, ...heat),
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemHeight: 120,
      itemWidth: 10,
      calculable: false,
      textStyle: { color: theme.text },
      inRange: { color: theme.sequential },
    },
    series: [
      {
        type: 'heatmap',
        data: heat.map((count, cell) => [cell % 24, Math.floor(cell / 24), count]),
        itemStyle: { borderColor: 'transparent', borderWidth: 2 },
      },
    ],
  };
}

export function calendarHeatmap(
  days: { day: string; total: number }[],
  theme: ChartTheme,
): { option: EChartsOption; height: number } {
  const years = [...new Set(days.map(({ day }) => day.slice(0, 4)))];
  const rowHeight = 150;
  return {
    height: years.length * rowHeight + 50,
    option: {
      tooltip: {
        formatter: (params) => {
          const [day, count] = (params as unknown as { data: [string, number] }).data;
          return `${day} — ${count.toLocaleString()}`;
        },
      },
      visualMap: {
        min: 0,
        max: Math.max(1, ...days.map(({ total }) => total)),
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemHeight: 120,
        itemWidth: 10,
        textStyle: { color: theme.text },
        inRange: { color: theme.sequential },
      },
      calendar: years.map((year, index) => ({
        range: year,
        top: index * rowHeight + 24,
        left: 44,
        right: 16,
        cellSize: ['auto', 14],
        yearLabel: { color: theme.text, position: 'left' },
        monthLabel: { color: theme.text },
        dayLabel: { color: theme.text, firstDay: 1 },
        splitLine: { show: false },
        itemStyle: { color: 'transparent', borderColor: theme.grid, borderWidth: 1 },
      })),
      series: years.map((year, index) => ({
        type: 'heatmap',
        coordinateSystem: 'calendar',
        calendarIndex: index,
        data: days.filter(({ day }) => day.startsWith(year)).map(({ day, total }) => [day, total]),
      })),
    },
  };
}
