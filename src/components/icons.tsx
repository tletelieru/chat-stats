import { SvgIcon } from '@mui/material';
import type { SvgIconProps } from '@mui/material';

const icon = (path: string) =>
  function Icon(props: SvgIconProps) {
    return (
      <SvgIcon {...props}>
        <path d={path} />
      </SvgIcon>
    );
  };

export const SunIcon = icon(
  'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM2 13h2a1 1 0 0 0 0-2H2a1 1 0 0 0 0 2zm18 0h2a1 1 0 0 0 0-2h-2a1 1 0 0 0 0 2zM11 2v2a1 1 0 0 0 2 0V2a1 1 0 0 0-2 0zm0 18v2a1 1 0 0 0 2 0v-2a1 1 0 0 0-2 0z',
);
export const MoonIcon = icon(
  'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z',
);
export const UploadIcon = icon('M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z');
export const FolderIcon = icon(
  'M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z',
);
export const LockIcon = icon(
  'M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6z',
);
export const BoltIcon = icon('M7 2v11h3v9l7-12h-4l4-8z');
export const ChartIcon = icon('M5 9h3v10H5zm5.5-5h3v15h-3zM16 13h3v6h-3z');
