export const environment = {
  production: true,
  apiUrl: 'https://api.votredomaine.com/api', // À CONFIGURER
  apiTimeout: 30000,
  cacheTimeout: 600000, // 10 minutes en production
  appName: 'LMS KLASSCI',
  appVersion: '1.0.0',

  // Configuration KLASSCI
  klassciApiUrl: 'https://api.votredomaine.com/api/proxy',

  // Configuration uploads
  maxFileSize: 52428800, // 50 MB
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

  defaultPageSize: 15,
  pageSizeOptions: [10, 15, 20, 50, 100],

  tokenRefreshInterval: 840000,
  sessionTimeout: 3600000,

  features: {
    forum: true,
    quiz: true,
    files: true,
    videoConference: false,
    notifications: false,
    analytics: true
  }
};
