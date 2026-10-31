import type { MessageKind } from '~/lib/model';
import type { HighlightId } from '~/lib/stats/highlights';
import type { ErrorCode, ProgressStep } from '~/lib/session';
import { defineMessages } from './react';

type Strings = {
  appName: string;
  tagline: string;
  newChat: string;
  toLight: string;
  toDark: string;
  language: string;
  errors: Record<ErrorCode, string>;
  progress: Record<ProgressStep, string>;
  hero: { title: string; subtitle: string };
  promises: { title: string; body: string }[];
  dropzone: {
    title: string;
    formats: string;
    chooseFile: string;
    chooseFolder: string;
    fileLabel: string;
    folderLabel: string;
    folderHint: string;
  };
  howTo: {
    title: string;
    guides: {
      name: 'Telegram' | 'WhatsApp';
      steps: string[];
      images?: { src: string; alt: string }[];
    }[];
  };
  privacy: string;
  footer: { developedBy: string; site: string };
  picker: {
    title: string;
    search: string;
    chat: string;
    messages: (count: string) => string;
  };
  review: {
    summary: (messages: string, people: number) => string;
    unknownMedia: (count: string) => string;
    preview: string;
    participants: string;
    nameFor: (name: string) => string;
    mergeInto: (name: string) => string;
    keepSeparate: string;
    show: string;
  };
  saved: { title: string; remove: (name: string) => string; removeLabel: string };
  filters: {
    range: string;
    all: string;
    lastYear: string;
    custom: string;
    from: string;
    to: string;
    person: string;
    everyone: string;
    gap: string;
    timeZone: string;
    phrase: string;
    sameZone: string;
    zoneFor: (name: string) => string;
  };
  save: { action: string; done: string };
  exportPdf: {
    action: string;
    title: string;
    includeQuotes: string;
    generate: string;
    generating: string;
    ready: string;
    download: string;
    share: string;
    shareTitle: string;
    close: string;
    failed: string;
  };
  highlights: {
    title: string;
    favoriteWord: string;
    favoritePair: string;
    favoriteTriple: string;
    favoriteEmoji: string;
    favoriteFace: string;
    favoriteShout: string;
    titles: Record<HighlightId, string>;
  };
  sections: {
    overview: string;
    conversations: string;
    responses: string;
    media: string;
    stickers: string;
    calls: string;
    activity: string;
    words: string;
  };
  stats: {
    messages: string;
    words: string;
    characters: string;
    daysActive: string;
    firstMessage: string;
    lastMessage: string;
    share: string;
    avgLength: string;
    conversations: string;
    perWeek: string;
    longestConversation: string;
    msgs: string;
    longestSilence: string;
    started: string;
    ended: string;
    doubleTexts: string;
    tripleTexts: string;
    longestBurst: string;
    repliesUsed: string;
    repliesReceived: string;
    mostReplied: string;
    media: string;
    responses: string;
    average: string;
    median: string;
    shortest: string;
    longest: string;
    pairShortest: (name: string) => string;
    pairLongest: (name: string) => string;
    distribution: string;
    monthlyAverage: string;
    byHour: string;
    links: string;
    voiceMinutes: string;
    avgVoice: string;
    longestVoice: string;
    edited: string;
    forwarded: string;
    deleted: string;
    callsMade: string;
    callsTotal: string;
    callsNoDetail: string;
    callsEstimated: string;
    totalTime: string;
    missed: string;
    longestCall: string;
    topHour: string;
    topWeekday: string;
    firstHour: string;
    lastHour: string;
    busiestDay: string;
    longestStreak: string;
    longestGap: string;
    days: (count: string) => string;
    since: (label: string, from: string) => string;
    perDay: string;
    timeline: string;
    perMonth: string;
    perWeekOption: string;
    heatmapPerson: string;
    laughs: string;
    faces: string;
    questions: string;
    upperMessages: string;
    upperWords: string;
    phraseMatches: string;
    reactionsGiven: string;
    topReactions: string;
    none: string;
    identifying: string;
    signature: string;
    replyTo: (name: string) => string;
    other: string;
    colorFor: (name: string) => string;
    customColor: string;
    gif: string;
    sticker: string;
    previewHint: string;
    less: string;
    tie: string;
    more: string;
  };
  charts: {
    distribution: string;
    monthly: string;
    byHour: string;
    calendar: string;
    timeline: string;
    heatmap: string;
  };
  kinds: Partial<Record<MessageKind, string>>;
  weekdays: string[];
  partsOfDay: string[];
  buckets: string[];
};

const en: Strings = {
  appName: 'Chat Stats',
  tagline: 'Private chat analytics',
  footer: { developedBy: 'Developed by', site: 'My site' },
  newChat: 'New chat',
  toLight: 'Switch to light mode',
  toDark: 'Switch to dark mode',
  language: 'Language',
  errors: {
    'no-chats': 'No chats found in this file.',
    'no-chat-file': 'This archive has no chat text file.',
    'html-export':
      'This is a Telegram HTML export. Export the chat again with the format set to Machine-readable JSON.',
    unsupported: 'Unsupported file. Use a Telegram result.json or a WhatsApp .txt or .zip.',
    unreadable: 'Could not read this file.',
  },
  progress: {
    opening: 'Opening file',
    listing: 'Reading chat list',
    parsing: 'Parsing messages',
    indexing: 'Indexing messages',
  },
  hero: {
    title: 'See what your chats really say',
    subtitle:
      'Who starts the conversation, who replies fastest, and when you talk most. Drop an export and find out, right on this device.',
  },
  promises: [
    { title: '100% private', body: 'No server, no uploads, no analytics.' },
    { title: 'Built for big chats', body: 'Hundreds of thousands of messages in seconds.' },
    { title: 'Telegram and WhatsApp', body: 'Works offline once it has loaded.' },
  ],
  dropzone: {
    title: 'Drop a chat export here',
    formats: 'Telegram result.json, WhatsApp .txt or .zip',
    chooseFile: 'Choose file',
    chooseFolder: 'Choose export folder',
    fileLabel: 'Chat export file',
    folderLabel: 'Chat export folder',
    folderHint: 'Pick the Telegram export folder to identify stickers and GIFs.',
  },
  howTo: {
    title: 'How to export a chat',
    guides: [
      {
        name: 'Telegram',
        steps: [
          'Open the chat in Telegram Desktop.',
          'Menu ⋮ → Export chat history.',
          'Click HTML next to Format, choose Machine-readable JSON and save.',
          'Optional: click "the oldest message" or "present" to pick a date range.',
          'Optional: keep Stickers and GIFs checked for previews. Photos and videos are not needed.',
          'Export, then open result.json here, or the whole folder to see sticker previews.',
        ],
        images: [
          { src: 'tutorial/telegram-menu.png', alt: 'Chat menu with Export chat history' },
          { src: 'tutorial/telegram-settings.png', alt: 'Export settings with Format set to HTML' },
          {
            src: 'tutorial/telegram-format.png',
            alt: 'Format dialog with Machine-readable JSON selected',
          },
          { src: 'tutorial/telegram-json.png', alt: 'Export settings with Format set to JSON' },
          { src: 'tutorial/telegram-dates.png', alt: 'Calendar to choose the date range' },
        ],
      },
      {
        name: 'WhatsApp',
        steps: [
          'Open the chat in WhatsApp Desktop.',
          'Menu ⋮ → Export chat.',
          'Choose All messages, or Custom date range to pick dates.',
          'Export, then open the .zip here.',
          'Desktop exports do not include media, so it appears as "omitted". To classify photos and audio, export from your phone with media included.',
        ],
        images: [
          { src: 'tutorial/whatsapp-menu.png', alt: 'Chat menu with Export chat' },
          { src: 'tutorial/whatsapp-all.png', alt: 'Export dialog with All messages selected' },
          { src: 'tutorial/whatsapp-range.png', alt: 'Export dialog with a custom date range' },
        ],
      },
    ],
  },
  privacy:
    'Nothing is uploaded, because there is no server. Nothing is stored unless you save stats, and those stay only in this browser. Saved stats keep top words, phrases, emoji and small sticker and GIF previews, never whole conversations.',
  picker: {
    title: 'Pick a chat',
    search: 'Search chats',
    chat: 'chat',
    messages: (count) => `${count} messages`,
  },
  review: {
    summary: (messages, people) => `${messages} messages, ${people} participants`,
    unknownMedia: (count) =>
      `${count} media messages have an unknown type. To classify them, export the chat from your phone with media included.`,
    preview: 'First messages',
    participants: 'Participants',
    nameFor: (name) => `Name for ${name}`,
    mergeInto: (name) => `Merge ${name} into`,
    keepSeparate: 'Keep separate',
    show: 'Show stats',
  },
  saved: {
    title: 'Saved stats',
    remove: (name) => `Delete ${name}`,
    removeLabel: 'Delete',
  },
  filters: {
    range: 'Date range',
    all: 'All',
    lastYear: 'Last year',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    person: 'Person',
    everyone: 'Everyone',
    gap: 'Convo gap (hours)',
    timeZone: 'Timezone',
    phrase: 'Phrase counter',
    sameZone: 'Same as above',
    zoneFor: (name) => `Timezone for ${name}`,
  },
  save: { action: 'Save stats on this device', done: 'Saved' },
  exportPdf: {
    action: 'Export results',
    title: 'Export results',
    includeQuotes: 'Include message quotes',
    generate: 'Create PDF',
    generating: 'Creating PDF',
    ready: 'Your PDF is ready.',
    download: 'Download',
    share: 'Share',
    shareTitle: 'Chat Stats',
    close: 'Close',
    failed: 'Could not create the PDF. Try again.',
  },
  highlights: {
    title: 'Highlights',
    favoriteWord: 'Most used word',
    favoritePair: 'Most used 2-word phrase',
    favoriteTriple: 'Most used 3-word phrase',
    favoriteEmoji: 'Most used emoji',
    favoriteFace: 'Most used keyboard face',
    favoriteShout: 'Most shouted word',
    titles: {
      starts: 'Always texts first',
      fastest: 'Replies the fastest',
      longestWait: 'Longest time on read',
      lastWord: 'Gets the last word',
      doubleTexter: 'Double texts the most',
      talker: 'Talks the most',
      essays: 'Writes the essays',
      voice: 'Voice note addict',
      stickers: 'Sticker spammer',
      nightOwl: 'Texts in the small hours',
      laughs: 'Laughs the most',
      questions: 'Asks all the questions',
      shouting: 'SHOUTS THE MOST',
    },
  },
  sections: {
    overview: 'Overview',
    conversations: 'Conversations',
    responses: 'Response times',
    media: 'Media and message types',
    stickers: 'Stickers and GIFs',
    calls: 'Calls',
    activity: 'Activity',
    words: 'Words and emoji',
  },
  stats: {
    messages: 'Messages',
    words: 'Words',
    characters: 'Characters',
    daysActive: 'Days active',
    firstMessage: 'First message',
    lastMessage: 'Last message',
    share: 'Share',
    avgLength: 'Average length',
    conversations: 'Conversations',
    perWeek: 'Per week',
    longestConversation: 'Longest conversation',
    msgs: 'msgs',
    longestSilence: 'Longest silence',
    started: 'Started',
    ended: 'Ended',
    doubleTexts: 'Double texts',
    tripleTexts: 'Triple texts or more',
    longestBurst: 'Longest burst',
    repliesUsed: 'Replies used',
    repliesReceived: 'Replies received',
    mostReplied: 'Most replied-to messages',
    media: '[media]',
    responses: 'Responses',
    average: 'Average',
    median: 'Median',
    shortest: 'Shortest',
    longest: 'Longest',
    pairShortest: (name) => `${name}, shortest`,
    pairLongest: (name) => `${name}, longest`,
    distribution: 'Distribution',
    monthlyAverage: 'Monthly average',
    byHour: 'By hour of day',
    links: 'Links',
    voiceMinutes: 'Voice minutes',
    avgVoice: 'Average voice length',
    longestVoice: 'Longest voice note',
    edited: 'Edited',
    forwarded: 'Forwarded',
    deleted: 'Deleted',
    callsMade: 'Calls made',
    callsTotal: 'Calls',
    callsEstimated:
      'Estimated. WhatsApp phone exports show calls as empty messages, with no duration or call type.',
    callsNoDetail:
      'WhatsApp only records the date of each call, not who called, how long it lasted or if it was video.',
    totalTime: 'Total time',
    missed: 'Missed or declined',
    longestCall: 'Longest call',
    topHour: 'Most active hour',
    topWeekday: 'Most active weekday',
    firstHour: 'Typical first hour',
    lastHour: 'Typical last hour',
    busiestDay: 'Busiest day',
    longestStreak: 'Longest streak',
    longestGap: 'Longest gap',
    days: (count) => `${count} days`,
    since: (label, from) => `${label} (from ${from})`,
    perDay: 'Messages per day',
    timeline: 'Timeline',
    perMonth: 'Per month',
    perWeekOption: 'Per week',
    heatmapPerson: 'Heatmap person',
    laughs: 'Laughs',
    faces: 'Keyboard faces',
    questions: 'Questions',
    upperMessages: 'Uppercase messages',
    upperWords: 'Uppercase words',
    phraseMatches: 'Phrase matches',
    reactionsGiven: 'Reactions given',
    topReactions: 'Top reactions',
    none: 'None',
    identifying: 'Identifying stickers and GIFs',
    signature: 'Signature',
    replyTo: (name) => `Most used as a reply to ${name}`,
    other: 'Other',
    colorFor: (name) => `Color for ${name}`,
    customColor: 'Custom',
    gif: 'GIF',
    sticker: 'Sticker',
    previewHint: 'Choose the export folder instead of result.json to see previews.',
    less: 'Less',
    tie: 'Tie',
    more: 'More',
  },
  charts: {
    distribution: 'Response time distribution per person',
    monthly: 'Average response time per month',
    byHour: 'Average response time by hour',
    calendar: 'Calendar heatmap of messages per day',
    timeline: 'Messages over time, stacked by person',
    heatmap: 'Messages by hour and weekday',
  },
  kinds: {
    photo: 'Photos',
    video: 'Videos',
    voice: 'Voice notes',
    video_note: 'Round video notes',
    audio: 'Audio files',
    sticker: 'Stickers',
    gif: 'GIFs',
    file: 'Documents',
    location: 'Locations',
    poll: 'Polls',
    contact: 'Contacts',
    unknown_media: 'Unknown media',
  },
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  partsOfDay: ['Night (0–6)', 'Morning (6–12)', 'Afternoon (12–19)', 'Evening (19–24)'],
  buckets: ['< 1 min', '1–5 min', '5–30 min', '30 min–1 h', '1–6 h', '≥ 6 h'],
};

const es: Strings = {
  appName: 'Chat Stats',
  tagline: 'Estadísticas privadas de tus chats',
  footer: { developedBy: 'Desarrollado por', site: 'Mi sitio' },
  newChat: 'Nuevo chat',
  toLight: 'Cambiar a modo claro',
  toDark: 'Cambiar a modo oscuro',
  language: 'Idioma',
  errors: {
    'no-chats': 'No se encontraron chats en este archivo.',
    'no-chat-file': 'Este archivo comprimido no tiene el texto del chat.',
    'html-export':
      'Esta es una exportación HTML de Telegram. Exporta el chat de nuevo con el formato Machine-readable JSON.',
    unsupported:
      'Archivo no compatible. Usa un result.json de Telegram o un .txt o .zip de WhatsApp.',
    unreadable: 'No se pudo leer este archivo.',
  },
  progress: {
    opening: 'Abriendo archivo',
    listing: 'Leyendo lista de chats',
    parsing: 'Procesando mensajes',
    indexing: 'Indexando mensajes',
  },
  hero: {
    title: 'Descubre lo que tus chats realmente dicen',
    subtitle:
      'Quién empieza la conversación, quién responde más rápido y cuándo hablan más. Suelta una exportación y averígualo, aquí mismo en tu dispositivo.',
  },
  promises: [
    { title: '100% privado', body: 'Sin servidor, sin subidas y sin analítica.' },
    { title: 'Hecho para chats grandes', body: 'Cientos de miles de mensajes en segundos.' },
    { title: 'Telegram y WhatsApp', body: 'Funciona sin conexión una vez cargado.' },
  ],
  dropzone: {
    title: 'Suelta aquí la exportación del chat',
    formats: 'result.json de Telegram, .txt o .zip de WhatsApp',
    chooseFile: 'Elegir archivo',
    chooseFolder: 'Elegir carpeta exportada',
    fileLabel: 'Archivo de exportación del chat',
    folderLabel: 'Carpeta de exportación del chat',
    folderHint: 'Elige la carpeta exportada de Telegram para identificar stickers y GIFs.',
  },
  howTo: {
    title: 'Cómo exportar un chat',
    guides: [
      {
        name: 'Telegram',
        steps: [
          'Abre el chat en Telegram Desktop.',
          'Menú ⋮ → Export chat history.',
          'Haz clic en HTML junto a Format, elige Machine-readable JSON y guarda.',
          'Opcional: haz clic en "the oldest message" o "present" para elegir un rango de fechas.',
          'Opcional: deja marcados Stickers y GIFs para ver sus vistas previas. Fotos y videos no hacen falta.',
          'Exporta y abre aquí result.json, o la carpeta completa para ver las vistas previas de stickers.',
        ],
        images: [
          { src: 'tutorial/telegram-menu.png', alt: 'Menú del chat con Export chat history' },
          {
            src: 'tutorial/telegram-settings.png',
            alt: 'Ajustes de exportación con el formato en HTML',
          },
          {
            src: 'tutorial/telegram-format.png',
            alt: 'Diálogo de formato con Machine-readable JSON elegido',
          },
          {
            src: 'tutorial/telegram-json.png',
            alt: 'Ajustes de exportación con el formato en JSON',
          },
          { src: 'tutorial/telegram-dates.png', alt: 'Calendario para elegir el rango de fechas' },
        ],
      },
      {
        name: 'WhatsApp',
        steps: [
          'Abre el chat en WhatsApp Desktop.',
          'Menú ⋮ → Export chat.',
          'Elige All messages, o Custom date range para escoger fechas.',
          'Exporta y abre aquí el .zip.',
          'Desde el escritorio no se incluye multimedia, por eso aparece como "omitted". Para clasificar fotos y audios, exporta desde el celular incluyendo los archivos.',
        ],
        images: [
          { src: 'tutorial/whatsapp-menu.png', alt: 'Menú del chat con Export chat' },
          { src: 'tutorial/whatsapp-all.png', alt: 'Diálogo de exportación con All messages' },
          { src: 'tutorial/whatsapp-range.png', alt: 'Diálogo de exportación con rango de fechas' },
        ],
      },
    ],
  },
  privacy:
    'No se sube nada, porque no hay servidor. Nada se guarda salvo que guardes las estadísticas, y quedan solo en este navegador. Conservan palabras, frases y emojis frecuentes y miniaturas de stickers y GIFs, nunca conversaciones completas.',
  picker: {
    title: 'Elige un chat',
    search: 'Buscar chats',
    chat: 'chat',
    messages: (count) => `${count} mensajes`,
  },
  review: {
    summary: (messages, people) => `${messages} mensajes, ${people} participantes`,
    unknownMedia: (count) =>
      `${count} mensajes multimedia tienen un tipo desconocido. Para clasificarlos, exporta el chat desde tu celular incluyendo los archivos.`,
    preview: 'Primeros mensajes',
    participants: 'Participantes',
    nameFor: (name) => `Nombre para ${name}`,
    mergeInto: (name) => `Unir ${name} con`,
    keepSeparate: 'Mantener separado',
    show: 'Ver estadísticas',
  },
  saved: {
    title: 'Estadísticas guardadas',
    remove: (name) => `Eliminar ${name}`,
    removeLabel: 'Eliminar',
  },
  filters: {
    range: 'Rango de fechas',
    all: 'Todo',
    lastYear: 'Último año',
    custom: 'Personalizado',
    from: 'Desde',
    to: 'Hasta',
    person: 'Persona',
    everyone: 'Todos',
    gap: 'Pausa entre charlas (horas)',
    timeZone: 'Zona horaria',
    phrase: 'Contador de frases',
    sameZone: 'Igual que la general',
    zoneFor: (name) => `Zona horaria de ${name}`,
  },
  save: { action: 'Guardar estadísticas en este dispositivo', done: 'Guardado' },
  exportPdf: {
    action: 'Exportar resultados',
    title: 'Exportar resultados',
    includeQuotes: 'Incluir citas de mensajes',
    generate: 'Crear PDF',
    generating: 'Creando PDF',
    ready: 'Tu PDF está listo.',
    download: 'Descargar',
    share: 'Compartir',
    shareTitle: 'Chat Stats',
    close: 'Cerrar',
    failed: 'No se pudo crear el PDF. Inténtalo de nuevo.',
  },
  highlights: {
    title: 'Destacados',
    favoriteWord: 'Palabra más usada',
    favoritePair: 'Frase de 2 palabras más usada',
    favoriteTriple: 'Frase de 3 palabras más usada',
    favoriteEmoji: 'Emoji más usado',
    favoriteFace: 'Cara de teclado más usada',
    favoriteShout: 'Palabra más gritada',
    titles: {
      starts: 'Siempre escribe primero',
      fastest: 'Responde más rápido',
      longestWait: 'El visto más largo',
      lastWord: 'Se queda con la última palabra',
      doubleTexter: 'Insiste con mensajes dobles',
      talker: 'Habla más',
      essays: 'Escribe testamentos',
      voice: 'Vive de notas de voz',
      stickers: 'Spamea stickers',
      nightOwl: 'Escribe de madrugada',
      laughs: 'Se ríe más',
      questions: 'Hace todas las preguntas',
      shouting: 'GRITA MÁS',
    },
  },
  sections: {
    overview: 'Resumen',
    conversations: 'Conversaciones',
    responses: 'Tiempos de respuesta',
    media: 'Multimedia y tipos de mensaje',
    stickers: 'Stickers y GIFs',
    calls: 'Llamadas',
    activity: 'Actividad',
    words: 'Palabras y emojis',
  },
  stats: {
    messages: 'Mensajes',
    words: 'Palabras',
    characters: 'Caracteres',
    daysActive: 'Días activos',
    firstMessage: 'Primer mensaje',
    lastMessage: 'Último mensaje',
    share: 'Porcentaje',
    avgLength: 'Largo promedio',
    conversations: 'Conversaciones',
    perWeek: 'Por semana',
    longestConversation: 'Conversación más larga',
    msgs: 'mensajes',
    longestSilence: 'Silencio más largo',
    started: 'Iniciadas',
    ended: 'Terminadas',
    doubleTexts: 'Mensajes dobles',
    tripleTexts: 'Mensajes triples o más',
    longestBurst: 'Racha más larga',
    repliesUsed: 'Respuestas usadas',
    repliesReceived: 'Respuestas recibidas',
    mostReplied: 'Mensajes más respondidos',
    media: '[multimedia]',
    responses: 'Respuestas',
    average: 'Promedio',
    median: 'Mediana',
    shortest: 'Más corta',
    longest: 'Más larga',
    pairShortest: (name) => `${name}, más corta`,
    pairLongest: (name) => `${name}, más larga`,
    distribution: 'Distribución',
    monthlyAverage: 'Promedio mensual',
    byHour: 'Por hora del día',
    links: 'Enlaces',
    voiceMinutes: 'Minutos de voz',
    avgVoice: 'Duración promedio de voz',
    longestVoice: 'Nota de voz más larga',
    edited: 'Editados',
    forwarded: 'Reenviados',
    deleted: 'Eliminados',
    callsMade: 'Llamadas hechas',
    callsTotal: 'Llamadas',
    callsEstimated:
      'Estimado. Los exports de WhatsApp desde el celular muestran las llamadas como mensajes vacíos, sin duración ni tipo.',
    callsNoDetail:
      'WhatsApp solo registra la fecha de cada llamada, no quién llamó, cuánto duró ni si fue video.',
    totalTime: 'Tiempo total',
    missed: 'Perdidas o rechazadas',
    longestCall: 'Llamada más larga',
    topHour: 'Hora más activa',
    topWeekday: 'Día más activo',
    firstHour: 'Primera hora habitual',
    lastHour: 'Última hora habitual',
    busiestDay: 'Día con más mensajes',
    longestStreak: 'Racha más larga',
    longestGap: 'Pausa más larga',
    days: (count) => `${count} días`,
    since: (label, from) => `${label} (desde ${from})`,
    perDay: 'Mensajes por día',
    timeline: 'Línea de tiempo',
    perMonth: 'Por mes',
    perWeekOption: 'Por semana',
    heatmapPerson: 'Persona del mapa de calor',
    laughs: 'Risas',
    faces: 'Caras de teclado',
    questions: 'Preguntas',
    upperMessages: 'Mensajes en mayúsculas',
    upperWords: 'Palabras en mayúsculas',
    phraseMatches: 'Coincidencias de la frase',
    reactionsGiven: 'Reacciones dadas',
    topReactions: 'Reacciones frecuentes',
    none: 'Ninguno',
    identifying: 'Identificando stickers y GIFs',
    signature: 'Sello personal',
    replyTo: (name) => `Más usado como respuesta a ${name}`,
    other: 'Otros',
    colorFor: (name) => `Color de ${name}`,
    customColor: 'Personalizado',
    gif: 'GIF',
    sticker: 'Sticker',
    previewHint: 'Elige la carpeta exportada en vez de result.json para ver las vistas previas.',
    less: 'Menos',
    tie: 'Empate',
    more: 'Más',
  },
  charts: {
    distribution: 'Distribución de tiempos de respuesta por persona',
    monthly: 'Tiempo de respuesta promedio por mes',
    byHour: 'Tiempo de respuesta promedio por hora',
    calendar: 'Mapa de calor de mensajes por día',
    timeline: 'Mensajes en el tiempo, apilados por persona',
    heatmap: 'Mensajes por hora y día de la semana',
  },
  kinds: {
    photo: 'Fotos',
    video: 'Videos',
    voice: 'Notas de voz',
    video_note: 'Videonotas',
    audio: 'Archivos de audio',
    sticker: 'Stickers',
    gif: 'GIFs',
    file: 'Documentos',
    location: 'Ubicaciones',
    poll: 'Encuestas',
    contact: 'Contactos',
    unknown_media: 'Multimedia desconocido',
  },
  weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  partsOfDay: ['Noche (0–6)', 'Mañana (6–12)', 'Tarde (12–19)', 'Atardecer (19–24)'],
  buckets: ['< 1 min', '1–5 min', '5–30 min', '30 min–1 h', '1–6 h', '≥ 6 h'],
};

export const messages = defineMessages({ en, es });
