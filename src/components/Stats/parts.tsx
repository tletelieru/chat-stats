import {
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import type { Ranked } from '~/lib/stats/types';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card variant="outlined" component="section" aria-label={title}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>
        <Stack spacing={2}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

export function Subheading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="subtitle2" component="h3">
      {children}
    </Typography>
  );
}

export function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Typography variant="h5" component="p">
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </div>
  );
}

export type Row = [label: string, values: (person: number) => string];

export function PersonTable({ names, rows }: { names: string[]; rows: Row[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell />
            {names.map((name) => (
              <TableCell key={name} align="right">
                {name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([label, value]) => (
            <TableRow key={label}>
              <TableCell component="th" scope="row">
                {label}
              </TableCell>
              {names.map((name, person) => (
                <TableCell key={name} align="right">
                  {value(person)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RankedChips({ items }: { items: Ranked[] }) {
  if (items.length === 0) return <Typography color="text.secondary">None</Typography>;
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {items.map(({ key, count }) => (
        <Chip key={key} size="small" label={`${key} · ${count.toLocaleString()}`} />
      ))}
    </Stack>
  );
}
