import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'
import { clearAllCache } from '../services/cache'
import {
  normalizeRole,
  isAdmin as roleIsAdmin,
  isSupradmin as roleIsSupradmin,
  isTeacher as roleIsTeacher,
  isStudent as roleIsStudent,
} from '../constants/roles'

/**
 * Store d'authentification — source de vérité unique de l'état d'auth (#19).
 *
 * Remplace l'accès dispersé et incohérent au storage (localStorage vs sessionStorage)
 * réparti sur 12 fichiers. Le bloc `auth` de api.js devient une façade fine déléguant
 * à ce store. Les getters d'autorisation dérivent de src/constants/roles.js (#18),
 * jamais réimplémentés.
 *
 * Persistance : sessionStorage (mécanisme unique, pas localStorage → atténuation XSS
 * #2/#6). sessionStorage survit au rechargement (F5) mais est effacé à la fermeture
 * de l'onglet et n'est pas partagé entre onglets — compromis de sécurité assumé.
 *
 * Anti-cycle ESM : ce module importe UNIQUEMENT l'instance axios `default` de api.js
 * au top-level (utilisée seulement dans les actions, à l'exécution). api.js importe
 * la définition `useAuthStore` mais ne l'appelle qu'à la volée — pas de cycle au chargement.
 */

const KEYS = Object.freeze({
  token: 'token',
  user: 'user',
  meta: 'meta',
  institution: 'institution',
})

/** Lecture tolérante d'une valeur JSON en sessionStorage (JSON corrompu → null). */
function readJSON(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  // --- State (hydraté depuis sessionStorage à la création du store) ---
  const user = ref(readJSON(KEYS.user))
  const token = ref(sessionStorage.getItem(KEYS.token) || null)
  const meta = ref(readJSON(KEYS.meta))
  const institution = ref(sessionStorage.getItem(KEYS.institution) || null)
  const institutionName = ref(meta.value?.institution_name ?? null)

  // --- Getters dérivés ---
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value ?? null) // jamais {} (R4.4)
  const userRole = computed(() => user.value?.role ?? null) // rôle brut
  const normalizedRole = computed(() => normalizeRole(user.value?.role))
  // Autorisation déléguée à roles.js (fail-secure hérité), jamais réimplémentée.
  const isAdmin = computed(() => roleIsAdmin(user.value)) // admin | supradmin (strict backend)
  const isSupradmin = computed(() => roleIsSupradmin(user.value))
  const isTeacher = computed(() => roleIsTeacher(user.value))
  const isStudent = computed(() => roleIsStudent(user.value))
  const institutionSlug = computed(() => meta.value?.institution ?? institution.value ?? null)
  const institutionDisplayName = computed(() => meta.value?.institution_name ?? null)

  // --- Actions ---

  /** Peuple l'état d'auth depuis la réponse de login et persiste en sessionStorage. */
  function setSession(data, metaPayload) {
    user.value = data?.user ?? null
    token.value = data?.token ?? null
    sessionStorage.setItem(KEYS.token, token.value ?? '')
    sessionStorage.setItem(KEYS.user, JSON.stringify(user.value))
    if (metaPayload) {
      meta.value = metaPayload
      institutionName.value = metaPayload.institution_name ?? null
      sessionStorage.setItem(KEYS.meta, JSON.stringify(metaPayload))
      if (metaPayload.institution) {
        institution.value = metaPayload.institution
        sessionStorage.setItem(KEYS.institution, metaPayload.institution)
      }
    }
  }

  /** Authentifie l'utilisateur (POST /auth/login) et ouvre la session si succès. */
  async function login(username, password) {
    const response = await api.post('/auth/login', { username, password })
    if (response.success && response.data) {
      setSession(response.data, response.meta)
    }
    return response
  }

  /** Change l'institution courante (dev local) et persiste le slug. */
  function setInstitution(slug) {
    institution.value = slug
    sessionStorage.setItem(KEYS.institution, slug)
  }

  /** Purge complète : state + sessionStorage + cache tenant-scopé. */
  function logout() {
    user.value = null
    token.value = null
    meta.value = null
    institution.value = null
    institutionName.value = null
    sessionStorage.removeItem(KEYS.token)
    sessionStorage.removeItem(KEYS.user)
    sessionStorage.removeItem(KEYS.meta)
    sessionStorage.removeItem(KEYS.institution)
    clearAllCache()
  }

  /** Profil courant (GET /auth/me) — ne mute pas l'état. */
  async function me() {
    return await api.get('/auth/me')
  }

  /** Liste des institutions actives (route publique) — ne mute pas l'état. */
  async function fetchActiveInstitutions() {
    return await api.get('/institutions/active')
  }

  return {
    // state
    user, token, meta, institution, institutionName,
    // getters
    isAuthenticated, currentUser, userRole, normalizedRole,
    isAdmin, isSupradmin, isTeacher, isStudent,
    institutionSlug, institutionDisplayName,
    // actions
    login, setSession, setInstitution, logout, me, fetchActiveInstitutions,
  }
})
