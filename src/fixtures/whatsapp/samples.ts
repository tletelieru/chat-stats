const LRM = String.fromCharCode(0x200e);
const NNBSP = String.fromCharCode(0x202f);

export const androidEs24h = [
  '30/10/26, 20:03 - Los mensajes y las llamadas están cifrados de extremo a extremo.',
  '30/10/26, 20:03 - Ana Prueba: hola',
  'segunda línea',
  '30/10/26, 20:04 - Beto Demo: <Multimedia omitido>',
  '30/10/26, 20:05 - Beto Demo: PTT-20261030-WA0001.opus (archivo adjunto)',
  '30/10/26, 20:06 - Ana Prueba: Se eliminó este mensaje.',
  '30/10/26, 20:07 - Ana Prueba: mira https://example.com <Se editó este mensaje.>',
  '30/10/26, 20:08 - Beto Demo cambió el asunto a: Otro',
].join('\n');

export const androidEs12h = [
  `30/10/2026, 8:03${NNBSP}p. m. - Ana Prueba: hola`,
  `30/10/2026, 12:15${NNBSP}a. m. - Beto Demo: IMG-20261030-WA0002.jpg (archivo adjunto)`,
].join('\r\n');

export const androidEnUs = [
  '10/30/26, 8:03 PM - Ana Prueba: hi',
  '10/30/26, 8:04 PM - Beto Demo: STK-20261030-WA0003.webp (file attached)',
].join('\n');

export const iosEs = [
  `[30/10/26, 20:03:15] Grupo Demo: ${LRM}Los mensajes están cifrados de extremo a extremo.`,
  `${LRM}[30/10/26, 20:03:20] Ana Prueba: hola`,
  `${LRM}[30/10/26, 20:04:00] Beto Demo: ${LRM}imagen omitida`,
  `${LRM}[30/10/26, 20:04:10] Beto Demo: ${LRM}audio omitido`,
  `${LRM}[30/10/26, 20:04:20] Ana Prueba: ${LRM}sticker omitido`,
  `${LRM}[30/10/26, 20:04:30] Ana Prueba: informe.pdf • 3 páginas ${LRM}documento omitido`,
  `${LRM}[30/10/26, 20:04:40] Beto Demo: ${LRM}<adjunto: 00000012-GIF-2026-10-30.mp4>`,
].join('\n');
