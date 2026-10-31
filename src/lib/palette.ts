import type { ColorMode } from './theme';

const MAX_SERIES = 8;

const LIGHT = {
  series: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  other: '#8a8984',
  sequential: ['#eef0f3', '#2a78d6', '#123a6b'],
  levels: ['#bfd7f5', '#7fb0ec', '#2a78d6', '#154a8c'],
  text: '#52514e',
  grid: '#e4e3df',
};

const DARK = {
  series: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
  other: '#8a8984',
  sequential: ['#2b2d33', '#3987e5', '#cfe2fa'],
  levels: ['#1f4470', '#2b69b5', '#3f8fec', '#a9cdf7'],
  text: '#c3c2b7',
  grid: '#3a3a38',
};

export type ChartTheme = typeof LIGHT;

export const chartTheme = (mode: ColorMode): ChartTheme => (mode === 'dark' ? DARK : LIGHT);

export function topPeople(weights: number[]): number[] {
  return weights
    .map((_, person) => person)
    .sort((a, b) => weights[b] - weights[a])
    .slice(0, MAX_SERIES);
}

export function defaultColors(weights: number[], theme: ChartTheme): string[] {
  const top = topPeople(weights);
  return weights.map((_, person) => {
    const slot = top.indexOf(person);
    return slot === -1 ? theme.other : theme.series[slot];
  });
}
