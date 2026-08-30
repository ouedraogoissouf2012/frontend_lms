import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api, { revokeSession } from '../services/api'
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
 * NB SECURITE : sessionStorage est LISIBLE par JavaScript — ce n'est PAS une
 * attenuation XSS (un XSS lit le token comme en localStorage). La vraie
 * protection est un cookie HttpOnly + Secure + SameSite emis par le backend
 * (DETTE tracee : migration front+back). Choix actuel : sessionStorage, efface a
 * la fermeture d'onglet, non partage entre onglets.
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
    // #230 — purge le cache localStorage du précédent utilisateur avant d'ouvrir
    // la nouvelle session (poste partagé : évite l'accumulation + les clés au
    // format pré-#230). Le scope par user de la clé empêche déjà la lecture
    // croisée ; cette purge complète l'hygiène.
    clearAllCache()

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

  /**
   * Purge complète de la session : état + sessionStorage + cache tenant-scopé,
   * ET révocation du token côté serveur (best-effort).
   *
   * La purge locale est SYNCHRONE et immédiate : l'UI se déconnecte sans attendre
   * le réseau (appelants `await`ants comme non-`await`ants inchangés). La révocation
   * part ensuite en arrière-plan avec le token CAPTURÉ avant la purge (l'intercepteur
   * ne l'attacherait plus, `token` étant déjà nul) et ignore tout échec.
   *
   * Avant, aucune révocation : le token Sanctum restait VALIDE après déconnexion
   * (rejouable jusqu'à expiration). Cf. api.js::revokeSession (hors intercepteurs).
   *
   * @param {{ revoke?: boolean }} [opts] revoke=false sur le chemin force-logout
   *   (api.js), où la session est déjà invalidée côté serveur.
   */
  function logout({ revoke = true } = {}) {
    const staleToken = token.value

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

    if (revoke && staleToken) {
      revokeSession(staleToken).catch(() => {
        // Réseau coupé / token déjà invalide : la session locale est déjà purgée.
      })
    }
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
