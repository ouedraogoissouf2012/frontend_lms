/**
 * useSeanceCreate — un seul composable pour créer une séance locale depuis les trois écrans.
 * ARRÊT 1 validé : offert seulement avec un catalogue `source: 'lms_local'` (D3) ; le couple
 * matière/classe vient de la même carte ; `matiere_id` n'est pas envoyé avant S-matière (D2) ;
 * aucune heure de fin (elle est estimée côté serveur) ; pas de double création ; D0.
 */
import { ref, nextTick } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  createSeance: vi.fn(), fetchTeacherMatieres: vi.fn(), clearCache: vi.fn(), clearCacheByPrefix: vi.fn(),
}))
vi.mock('@/services/lmsSeances', () => ({ lmsSeancesService: { createSeance: (...a) => m.createSeance(...a) } }))
vi.mock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: (...a) => m.fetchTeacherMatieres(...a) }))
vi.mock('@/services/cache', () => ({
  clearCache: (...a) => m.clearCache(...a), clearCacheByPrefix: (...a) => m.clearCacheByPrefix(...a),
}))

import { useSeanceCreate } from '@/composables/useSeanceCreate'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const LOCAL = [
  { id: 5, nom: 'Maths', source: 'lms_local', classes: [{ id: 11, nom: '6e A' }, { id: 12, nom: '5e B' }] },
  { id: 6, nom: 'Physique', source: 'lms_local', classes: [] },
]
const KLASSCI = [{ id: 900, nom: 'Maths', classes: [{ id: 901, nom: '6e A' }] }]

function remplir(c, { matiereId = 5, classeId = 11, titre = 'Révision', debut = '2026-11-13T08:30' } = {}) {
  Object.assign(c.form, { matiereId, titre, debut })
  c.form.classeId = classeId
}

beforeEach(() => {
  for (const f of Object.values(m)) f.mockReset()
})

describe('disponible — D3 : jamais sans catalogue local', () => {
  it('catalogue KLASSCI (sans source) → indisponible ; catalogue local → disponible', () => {
    expect(useSeanceCreate({ matieres: ref(KLASSCI) }).disponible.value).toBe(false)
    expect(useSeanceCreate({ matieres: ref([]) }).disponible.value).toBe(false)
    expect(useSeanceCreate({ matieres: ref(LOCAL) }).disponible.value).toBe(true)
  })

  it('sans liste fournie : charge /proxy/matieres (fetchTeacherMatieres) ; un échec laisse indisponible', async () => {
    m.fetchTeacherMatieres.mockResolvedValue(LOCAL)
    const c = useSeanceCreate()
    await c.chargerCatalogue()
    expect(c.disponible.value).toBe(true)
    m.fetchTeacherMatieres.mockRejectedValue(new Error('panne'))
    const d = useSeanceCreate()
    await d.chargerCatalogue()
    expect(d.disponible.value).toBe(false)
  })

  it('liste fournie : aucun second appel', async () => {
    await useSeanceCreate({ matieres: ref(LOCAL) }).chargerCatalogue()
    expect(m.fetchTeacherMatieres).not.toHaveBeenCalled()
  })
})

describe('le couple matière/classe vient de la même carte', () => {
  it('les classes proposées sont celles de la matière choisie ; changer de matière efface la classe', async () => {
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    c.form.matiereId = 5
    expect(c.classesDisponibles.value.map((x) => x.id)).toEqual([11, 12])
    c.form.classeId = 11
    c.form.matiereId = 6
    await nextTick()
    expect(c.classesDisponibles.value).toEqual([])
    expect(c.form.classeId).toBeNull()
  })
})

describe('creer — validation locale, charge exacte, refus dits', () => {
  it('titre trop court, début absent, matière absente : aucun envoi, chaque champ dit', async () => {
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c, { matiereId: null, titre: 'ab', debut: '' })
    expect(await c.creer()).toBeNull()
    expect(m.createSeance).not.toHaveBeenCalled()
    expect(Object.keys(c.erreurs.value).sort()).toEqual(['date_seance', 'matiere', 'titre'])
  })

  it('charge : titre, début ISO avec décalage, classe et noms ; ni matiere_id ni heure de fin', async () => {
    m.createSeance.mockResolvedValue({ id: 42 })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c, { titre: '  Révision  ' })
    expect(await c.creer()).toEqual({ id: 42 })
    const charge = m.createSeance.mock.calls[0][0]
    expect(Object.keys(charge).sort()).toEqual(['classe_id', 'classe_nom', 'date_seance', 'matiere_nom', 'titre'])
    expect(charge).toMatchObject({ titre: 'Révision', classe_id: 11, classe_nom: '6e A', matiere_nom: 'Maths' })
    expect(charge.date_seance).toMatch(/^2026-11-13T08:30:00[+-]\d{2}:\d{2}$/)
  })

  it('sans classe : ni classe_id ni classe_nom', async () => {
    m.createSeance.mockResolvedValue({ id: 43 })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c, { classeId: null })
    await c.creer()
    expect(m.createSeance.mock.calls[0][0]).not.toHaveProperty('classe_id')
    expect(m.createSeance.mock.calls[0][0]).not.toHaveProperty('classe_nom')
  })

  it('succès : les caches de séances des trois écrans sont purgés, le formulaire remis à zéro', async () => {
    m.createSeance.mockResolvedValue({ id: 42 })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(m.clearCache).toHaveBeenCalledWith('teacher_seances')
    expect(m.clearCacheByPrefix).toHaveBeenCalledWith('seances_management_d')
    expect(m.clearCacheByPrefix).toHaveBeenCalledWith('admin_seances_d')
    expect(c.form.titre).toBe('')
  })

  it('pas de double création : un second clic pendant l’envoi n’envoie rien', async () => {
    let fin
    m.createSeance.mockReturnValue(new Promise((r) => { fin = r }))
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c)
    const premier = c.creer()
    expect(c.envoi.value).toBe(true)
    expect(await c.creer()).toBeNull()
    fin({ id: 1 })
    await premier
    expect(m.createSeance).toHaveBeenCalledTimes(1)
    expect(c.envoi.value).toBe(false)
  })

  it('422 : chaque champ connu dit NOTRE message, jamais le texte du serveur (D0) ; pas de Réessayer', async () => {
    m.createSeance.mockRejectedValue({
      response: { status: 422, data: { errors: { titre: ['TEXTE SERVEUR'] } } },
      userMessage: 'TEXTE SERVEUR', fieldErrors: { titre: ['TEXTE SERVEUR'] },
    })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(c.erreurs.value.titre).toBeTruthy()
    expect(JSON.stringify(c.erreurs.value) + c.erreur.value).not.toContain('TEXTE SERVEUR')
    expect(c.erreur.value).toBe(ERROR_MESSAGES.validation)
    expect(c.canRetry.value).toBe(false)
  })

  it('class_out_of_scope : message du catalogue, classe effacée, pas de Réessayer', async () => {
    m.createSeance.mockRejectedValue({ response: { status: 404, data: { reason: 'class_out_of_scope' } }, userMessage: 'du catalogue' })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(c.erreur.value).toBe('du catalogue')
    expect(c.form.classeId).toBeNull()
    expect(c.canRetry.value).toBe(false)
  })

  it('panne (503) : erreur dite et Réessayer', async () => {
    m.createSeance.mockRejectedValue({ response: { status: 503, data: {} }, userMessage: 'indisponible' })
    const c = useSeanceCreate({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(c.erreur.value).toBe('indisponible')
    expect(c.canRetry.value).toBe(true)
  })
})
