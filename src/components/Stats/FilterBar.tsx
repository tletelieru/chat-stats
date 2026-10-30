import { Autocomplete, Grid, MenuItem, TextField } from '@mui/material';
import type { Participant } from '~/lib/model';

export type RangePreset = 'all' | 'year' | 'custom';

export type Controls = {
  preset: RangePreset;
  fromDate: string;
  toDate: string;
  person: string;
  gapHours: number;
  timeZone: string;
  phrase: string;
  personZones: Record<number, string>;
};

const ZONES = Intl.supportedValuesOf('timeZone');
const SAME_ZONE = 'Same as above';

type Props = {
  people: Participant[];
  controls: Controls;
  onChange: (controls: Controls) => void;
};

export default function FilterBar({ people, controls, onChange }: Props) {
  const set = (patch: Partial<Controls>) => onChange({ ...controls, ...patch });

  const setPersonZone = (person: number, zone: string | null) => {
    const others = Object.entries(controls.personZones).filter(([key]) => Number(key) !== person);
    set({
      personZones: Object.fromEntries(
        zone && zone !== SAME_ZONE ? [...others, [person, zone]] : others,
      ),
    });
  };

  return (
    <Grid container spacing={1}>
      <Grid size={{ xs: 6, md: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Date range"
          value={controls.preset}
          onChange={(event) => set({ preset: event.target.value as RangePreset })}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="year">Last year</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </TextField>
      </Grid>
      {controls.preset === 'custom' && (
        <>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              slotProps={{ inputLabel: { shrink: true } }}
              value={controls.fromDate}
              onChange={(event) => set({ fromDate: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              slotProps={{ inputLabel: { shrink: true } }}
              value={controls.toDate}
              onChange={(event) => set({ toDate: event.target.value })}
            />
          </Grid>
        </>
      )}
      <Grid size={{ xs: 6, md: 2 }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Person"
          value={controls.person}
          onChange={(event) => set({ person: event.target.value })}
        >
          <MenuItem value="">Everyone</MenuItem>
          {people.map(({ id, name }, index) => (
            <MenuItem key={id} value={String(index)}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={{ xs: 6, md: 2 }}>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Convo gap (hours)"
          slotProps={{ htmlInput: { min: 0.5, step: 0.5 } }}
          value={controls.gapHours}
          onChange={(event) => {
            const gapHours = Number(event.target.value);
            if (gapHours > 0) set({ gapHours });
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Autocomplete
          size="small"
          disableClearable
          options={ZONES}
          value={controls.timeZone}
          onChange={(_, timeZone) => set({ timeZone })}
          renderInput={(params) => <TextField {...params} label="Timezone" />}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          size="small"
          label="Phrase counter"
          value={controls.phrase}
          onChange={(event) => set({ phrase: event.target.value })}
        />
      </Grid>
      {people.length <= 8 &&
        people.map(({ id, name }, index) => (
          <Grid key={id} size={{ xs: 12, md: 4 }}>
            <Autocomplete
              size="small"
              disableClearable
              options={[SAME_ZONE, ...ZONES]}
              value={controls.personZones[index] ?? SAME_ZONE}
              onChange={(_, zone) => setPersonZone(index, zone)}
              renderInput={(params) => <TextField {...params} label={`Timezone for ${name}`} />}
            />
          </Grid>
        ))}
    </Grid>
  );
}
