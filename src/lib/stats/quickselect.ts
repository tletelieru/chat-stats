export function quickselect(values: Float64Array, k: number): number {
  let left = 0;
  let right = values.length - 1;

  while (left < right) {
    const pivot = values[(left + right) >>> 1];
    let low = left;
    let high = right;

    while (low <= high) {
      while (values[low] < pivot) low++;
      while (values[high] > pivot) high--;
      if (low <= high) {
        const swap = values[low];
        values[low] = values[high];
        values[high] = swap;
        low++;
        high--;
      }
    }

    if (k <= high) right = high;
    else if (k >= low) left = low;
    else break;
  }

  return values[k];
}

export function percentile(values: Float64Array, ratio: number): number | null {
  if (values.length === 0) return null;
  return quickselect(values, Math.floor((values.length - 1) * ratio));
}

export class GrowableFloats {
  private buffer = new Float64Array(64);
  private size = 0;

  push(value: number) {
    if (this.size === this.buffer.length) {
      const next = new Float64Array(this.buffer.length * 2);
      next.set(this.buffer);
      this.buffer = next;
    }
    this.buffer[this.size++] = value;
  }

  view(): Float64Array {
    return this.buffer.subarray(0, this.size);
  }
}
