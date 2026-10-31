import type { EChartsOption } from 'echarts';
import { topPeople } from '~/lib/palette';
import type { ChartTheme } from '~/lib/palette';

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
  otherLabel: string,
  personColors: string[] = [],
): Series[] {
  const shown = new Set(topPeople(weights));
  const series: Series[] = [];
  let other: (number | null)[] | null = null;

  names.forEach((name, person) => {
    if (shown.has(person)) {
      const color = personColors[person] ?? theme.series[topPeople(weights).indexOf(person)];
      series.push({ name, color, values: rows[person] });
    } else {
      const base: (number | null)[] = other ?? rows[person].map(() => 0);
      other = base.map((value, index) => (value ?? 0) + (rows[person][index] ?? 0));
    }
  });

  if (other) series.push({ name: otherLabel, color: theme.other, values: other });
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
  personColor?: string,
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
      inRange: { color: personColor ? [theme.sequential[0], personColor] : theme.sequential },
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

const MIN_CELL_STRENGTH = 0.25;

export function mixColors(from: string, to: string, ratio: number): string {
  const channel = (hex: string, start: number) => parseInt(hex.slice(start, start + 2), 16);
  const mixed = [1, 3, 5].map((start) => {
    const value = channel(from, start) + (channel(to, start) - channel(from, start)) * ratio;
    return Math.round(value).toString(16).padStart(2, '0');
  });
  return `#${mixed.join('')}`;
}

export function dominantCell(counts: number[]): number | null {
  const max = Math.max(...counts);
  if (max === 0 || counts.filter((count) => count === max).length > 1) return null;
  return counts.indexOf(max);
}

type DominantHeatmap = {
  perPerson: number[][];
  names: string[];
  colors: string[];
  hours: string[];
  weekdays: string[];
  theme: ChartTheme;
  tieColor: string;
};

export function dominantHeatmap({
  perPerson,
  names,
  colors,
  hours,
  weekdays,
  theme,
  tieColor,
}: DominantHeatmap): EChartsOption {
  const totals = perPerson[0].map((_, cell) =>
    perPerson.reduce((sum, heat) => sum + heat[cell], 0),
  );
  const max = Math.max(1, ...totals);
  const base = hourHeatmap(totals, hours, weekdays, theme);
  const empty = theme.sequential[0];

  return {
    grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: base.xAxis,
    yAxis: base.yAxis,
    tooltip: {
      formatter: (params) => {
        const [hour, day, count] = (params as unknown as { data: { value: number[] } }).data.value;
        const cell = day * 24 + hour;
        const detail = names.map((name, person) => `${name}: ${perPerson[person][cell]}`);
        return `${weekdays[day]} ${hours[hour]}:00 — ${count.toLocaleString()}<br/>${detail.join('<br/>')}`;
      },
    },
    series: [
      {
        type: 'heatmap',
        data: totals.map((total, cell) => {
          const leader = dominantCell(perPerson.map((heat) => heat[cell]));
          const ratio = MIN_CELL_STRENGTH + (1 - MIN_CELL_STRENGTH) * (total / max);
          const color = leader === null ? tieColor : colors[leader];
          return {
            value: [cell % 24, Math.floor(cell / 24), total],
            itemStyle: {
              color: total === 0 ? empty : mixColors(empty, color, ratio),
              borderColor: 'transparent',
              borderWidth: 2,
            },
          };
        }),
      },
    ],
  };
}
