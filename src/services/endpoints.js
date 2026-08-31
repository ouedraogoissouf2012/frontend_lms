/**
 * Carte UNIQUE des endpoints d'API (#105, E1).
 *
 * Registre centralisé de TOUS les chemins d'API consommés par les services
 * existants (api.js, klassci.js, lms*.js). On centralise les CHEMINS, pas la
 * logique : aucun `api.get/post/...` ici, aucune dépendance, aucune règle
 * métier. Les services restent les seuls à porter try/catch, transformation
 * de réponse et frontières d'usage.
 *
 * Frontière BRUT vs ENRICHI (#26 — cf. en-tête de src/services/klassci.js) :
 *  - `endpoints.klassci.*` → `/proxy/*` : données KLASSCI BRUTES (passe-plat).
 *  - `endpoints.lms.*`     → `/lms/*`   : données ENRICHIES LMS.
 * Cette séparation est STRUCTURELLE ici : un chemin `/proxy/*` ne doit jamais
 * apparaître sous `endpoints.lms`, ni l'inverse (garde-fou testé, #26).
 *
 * Convention : chemin statique = chaîne ; chemin paramétré = fonction pure
 * (ex. `classeEtudiants: (id) => `/proxy/classes/${id}/etudiants``). Les query strings
 * (?with_details, ?page…) restent à la charge des appelants (orthogonaux).
 */

// Préfixes de frontière (#26) — source unique, évite la dérive proxy/lms.
const KLASSCI = '/proxy'
const LMS = '/lms'

export const endpoints = {
  // ── KLASSCI — BRUT (/proxy/*) ───────────────────────────────────────────
  klassci: {
    classes: `${KLASSCI}/classes`,
    classeEtudiants: (id) => `${KLASSCI}/classes/${id}/etudiants`,
    matieres: `${KLASSCI}/matieres`,
    enseignants: `${KLASSCI}/enseignants`,
    emploiTemps: `${KLASSCI}/emploi-temps`,
    structure: `${KLASSCI}/structure`,
    evaluations: `${KLASSCI}/evaluations`,
    studentDashboard: `${KLASSCI}/me/dashboard`,
    teacherDashboard: `${KLASSCI}/me/teacher-dashboard`,
  },

  // ── LMS — ENRICHI (/lms/*) ──────────────────────────────────────────────
  lms: {
    enseignants: `${LMS}/enseignants`,

    classes: {
      details: (id) => `${LMS}/classes/${id}`,
      etudiants: (id) => `${LMS}/classes/${id}/etudiants`,
    },

    matieres: {
      details: (id) => `${LMS}/matieres/${id}`,
      myTeacher: `${LMS}/teacher/my-matieres`,
    },

    seances: {
      upcoming: `${LMS}/seances/upcoming`,
      history: `${LMS}/seances/history`,
      myTeaching: `${LMS}/seances/my-teaching`,
      myClasses: `${LMS}/seances/my-classes`,
      details: (id) => `${LMS}/seances/${id}/details`,
      participants: (id) => `${LMS}/seances/${id}/participants`,
      attendances: (id) => `${LMS}/seances/${id}/attendances`,
      validateParticipant: (id) => `${LMS}/seances/${id}/validate-participant`,
      hide: (id) => `${LMS}/seances/${id}/hide`,
      unhide: (id) => `${LMS}/seances/${id}/unhide`,
      delete: (id) => `${LMS}/seances/${id}`,
    },

    // Cycle de vie visio d'une séance (sous /lms/seances/{id}/*).
    visio: {
      toggle: (id) => `${LMS}/seances/${id}/toggle-visio`,
      activate: (id) => `${LMS}/seances/${id}/activate-visio`,
      deactivate: (id) => `${LMS}/seances/${id}/deactivate-visio`,
      start: (id) => `${LMS}/seances/${id}/start-visio`,
      end: (id) => `${LMS}/seances/${id}/end-visio`,
      join: (id) => `${LMS}/seances/${id}/join`,
      leave: (id) => `${LMS}/seances/${id}/leave`,
      heartbeat: (id) => `${LMS}/seances/${id}/heartbeat`,
      participants: (id) => `${LMS}/seances/${id}/visio-participants`,
      recordingStatus: (id) => `${LMS}/seances/${id}/recording`,
      recordingStart: (id) => `${LMS}/seances/${id}/recording/start`,
      recordingStop: (id) => `${LMS}/seances/${id}/recording/stop`,
    },

    attendance: {
      history: `${LMS}/attendance/history`,
      fromVideoSession: `${LMS}/attendances/from-video-session`,
    },
  },

  // ── ADMIN (/admin/*) ────────────────────────────────────────────────────
  admin: {
    matieres: '/admin/matieres',
    institutions: {
      list: '/admin/institutions',
      details: (id) => `/admin/institutions/${id}`,
      toggle: (id) => `/admin/institutions/${id}/toggle`,
      testConnection: (id) => `/admin/institutions/${id}/test-connection`,
    },
    analytics: {
      activityTrends: '/admin/analytics/activity-trends',
      systemMetrics: '/admin/analytics/system-metrics',
      pendingTasks: '/admin/analytics/pending-tasks',
      recentUsers: '/admin/analytics/recent-users',
    },
    notifications: {
      create: '/admin/notifications/create',
      stats: '/admin/notifications/stats',
    },
    reports: (type) => `/admin/reports/${type}`,
  },

  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
    institutionsActive: '/institutions/active',
  },

  lessons: {
    list: '/lessons',
    details: (id) => `/lessons/${id}`,
    myCourses: '/lessons/my-courses',
    publish: (id) => `/lessons/${id}/publish`,
    unpublish: (id) => `/lessons/${id}/unpublish`,
    progress: (id) => `/lessons/${id}/progress`,
    complete: (id) => `/lessons/${id}/complete`,
    rating: (id) => `/lessons/${id}/rating`,
    chapterProgress: (id) => `/lessons/${id}/chapter-progress`,
  },

  // ── DASHBOARD LMS local (/dashboard/*) — distinct des dashboards KLASSCI
  //    /proxy/me/* ci-dessus, qu'on conserve séparément (#26). ─────────────
  dashboard: {
    student: '/dashboard/student',
    teacher: '/dashboard/teacher',
    stats: '/dashboard/stats',
  },

  // ── FORUM (/forum/*) ────────────────────────────────────────────────────
  forum: {
    topics: '/forum/topics',
    topic: (id) => `/forum/topics/${id}`,
    topicPosts: (id) => `/forum/topics/${id}/posts`,
    closeTopic: (id) => `/forum/topics/${id}/close`,
    pinTopic: (id) => `/forum/topics/${id}/pin`,
    post: (id) => `/forum/posts/${id}`,
    postSolution: (id) => `/forum/posts/${id}/solution`,
  },

  // ── DIVERS ──────────────────────────────────────────────────────────────
  teacher: {
    stats: '/teacher/stats',
  },
  // ── ÉVALUATIONS LMS (/evaluations/*) — enrichi, ≠ /proxy/evaluations brut KLASSCI ──
  evaluations: {
    list: '/evaluations',
    // Évaluations de l'étudiant CONNECTÉ (anti-IDOR #17 Ék-6 : aucun id client, l'identité
    // vient du token ; ne JAMAIS réintroduire /evaluations/student/{id}).
    student: '/evaluations/student',
    details: (id) => `/evaluations/${id}`,
    publish: (id) => `/evaluations/${id}/publish`,
    start: (id) => `/evaluations/${id}/start`,
    submit: (id) => `/evaluations/${id}/submit`,
    syncKlassci: (id) => `/evaluations/${id}/sync-klassci`,
    timeStatus: (id) => `/evaluations/${id}/time-status`,
    resultsByClass: (id) => `/evaluations/${id}/results-by-class`,
    preview: (id) => `/evaluations/${id}/preview`,
    mySubmission: (id) => `/evaluations/${id}/my-submission`,
  },

  chapters: {
    ofLesson: (lessonId) => `/lessons/${lessonId}/chapters`,
    reorder: (lessonId) => `/lessons/${lessonId}/chapters/reorder`,
    details: (chapterId) => `/chapters/${chapterId}`,
    progress: (chapterId) => `/chapters/${chapterId}/progress`,
    complete: (chapterId) => `/chapters/${chapterId}/complete`,
    time: (chapterId) => `/chapters/${chapterId}/time`,
    upload: (chapterId) => `/chapters/${chapterId}/upload`,
  },

  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    recent: '/notifications/recent',
    markAsRead: (id) => `/notifications/${id}/mark-as-read`,
    markAllAsRead: '/notifications/mark-all-as-read',
    delete: (id) => `/notifications/${id}`,
    deleteReadAll: '/notifications/read/all',
  },

  knowledgeChecks: {
    list: '/knowledge-checks',
    details: (id) => `/knowledge-checks/${id}`,
    start: (id) => `/knowledge-checks/${id}/start`,
    submit: (id) => `/knowledge-checks/${id}/submit`,
    myAttempts: (id) => `/knowledge-checks/${id}/my-attempts`,
    byChapter: (id) => `/knowledge-checks/chapter/${id}`,
  },

  search: {
    query: '/search',
    suggestions: '/search/suggestions',
    history: '/search/history',
  },

  grades: {
    mine: '/my-grades',
  },
}

export default endpoints
