/**
 * Les règles pures du calendrier de l'année (#678, lms_backend#1671). Les dates d'un événement sont des JOURS
 * (`AAAA-MM-JJ`) : elles se calculent sans fuseau, composante par composante.
 */
export const TYPES_D_EVENEMENT = Object.freeze({
  rentree: 'Rentrée',
  orientation: 'Orientation',
  examens: 'Examens',
  vacances: 'Vacances',
  reprise: 'Reprise',
  soutenances: 'Soutenances',
  ceremonie: 'Cérémonie',
  fermeture: 'Fermeture',
  autre: 'Autre',
})

/** Les types qui ferment les jours (aucune séance) : seuls à paraître en fond des emplois du temps (ARRÊT 1, Q3). */
export const TYPES_FERMANT_LES_JOURS = Object.freeze(['vacances', 'fermeture'])

export const libelleDuType = (type) => TYPES_D_EVENEMENT[type] ?? String(type ?? '')

const deux = (n) => String(n).padStart(2, '0')

/** Une date locale → `AAAA-MM-JJ`. */
export const jourIso = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`

/** `AAAA-MM-JJ` décalé de n jours, sans fuseau. */
export function decaler(iso, n) {
  const [a, m, j] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1, j + n))
  return `${d.getUTCFullYear()}-${deux(d.getUTCMonth() + 1)}-${deux(d.getUTCDate())}`
}

/** Le premier et le dernier jour du mois d'une date. */
export function plageDuMois(date) {
  const premier = new Date(date.getFullYear(), date.getMonth(), 1)
  const dernier = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { du: jourIso(premier), au: jourIso(dernier) }
}

/** `2026-12-07` → `07/12/2026`. */
export function jourFr(iso) {
  const [a, m, j] = String(iso ?? '').split('-')
  return a && m && j ? `${j}/${m}/${a}` : '—'
}

/** Un événement du serveur → un événement FullCalendar d'une journée entière (la fin de FullCalendar est EXCLUSIVE). */
export function enJourneesEntieres(e, extra = {}) {
  return {
    id: `calendrier-${e.id}`,
    title: e.titre,
    start: e.debut,
    end: decaler(e.fin, 1),
    allDay: true,
    extendedProps: { type: e.type, evenementId: e.id },
    ...extra,
  }
}
