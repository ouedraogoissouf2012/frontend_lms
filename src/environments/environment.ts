// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  apiTimeout: 30000, // 30 secondes
  cacheTimeout: 300000, // 5 minutes
  appName: 'LMS KLASSCI',
  appVersion: '1.0.0',

  // Configuration KLASSCI
  klassciApiUrl: 'http://localhost:8000/api/proxy',

  // Configuration uploads
  maxFileSize: 52428800, // 50 MB en octets
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'text/plain'
  ],

  // Pagination par défaut
  defaultPageSize: 15,
  pageSizeOptions: [10, 15, 20, 50, 100],

  // Durées
  tokenRefreshInterval: 840000, // 14 minutes (refresh avant expiration à 15min)
  sessionTimeout: 3600000, // 1 heure

  // Features flags
  features: {
    forum: true,
    quiz: true,
    files: true,
    videoConference: false, // À activer plus tard
    notifications: false,   // À activer plus tard
    analytics: true
  }
};
