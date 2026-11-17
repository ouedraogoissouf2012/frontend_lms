/**
 * lms_backend#1121 (décision du user, 17/11) : dans une école AUTONOME, une séance se modifie (titre, date et heure,
 * classe ; la matière ne change pas). Dans une école KLASSCI, elle se modifie dans KLASSCI : aucun « Modifier ».
 * Contrat back (ARRÊT 1 validé) : PUT /lms/seances/{id}. Le bouton suit UNIQUEMENT `can_be_edited === true`, calculé
 * par le serveur pour le compte qui lit : ni le rôle, ni le catalogue, ni la date. Monté sur les trois écrans de
 * séances (enseignant, coordinateur, gestion). D0 : aucun texte du serveur.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  updateSeance: vi.fn(), fetchTeacherMatieres: vi.fn(), clearCache: vi.fn(), clearCacheByPrefix: vi.fn(),
  role: { valeur: 'enseignant' },
}))
vi.mock('@/services/lmsSeances', () => ({ lmsSeancesService: { updateSeance: (...a) => m.updateSeance(...a) } }))
vi.mock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: (...a) => m.fetchTeacherMatieres(...a) }))
vi.mock('@/services/cache', () => ({ clearCache: (...a) => m.clearCache(...a), clearCacheByPrefix: (...a) => m.clearCacheByPrefix(...a) }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, role: m.role.valeur }) } }))

import SeanceEditAction from '@/components/seances/SeanceEditAction.vue'
import SeanceCard from '@/components/seances/SeanceCard.vue'
import CoordinatorSeanceCard from '@/components/seances/CoordinatorSeanceCard.vue'
import SeancesList from '@/components/admin/SeancesList.vue'
import { saisieLocale, isoAvecDecalage } from '@/utils/dateLocale'
import { messageForReason } from '@/services/errorHandler'

const SERVEUR = 'Texte fictif du serveur, jamais montré'
const CATALOGUE = [
  { id: 5, nom: 'Mathématiques', source: 'lms_local', classes: [{ id: 11, nom: '6e A' }, { id: 12, nom: '6e B' }] },
]
const DEBUT = '2026-11-20T08:30'
const seance = (extra = {}) => ({
  id: 77, titre: 'Fractions', date_debut: isoAvecDecalage(DEBUT), date_fin: null,
  matiere: { id: 5, nom: 'Mathématiques' }, classe: { id: 11, nom: '6e A' }, visio_enabled: false, ...extra,
})
const monter = (s) => mount(SeanceEditAction, { props: { seance: s }, global: { stubs: { teleport: true } } })
const bouton = (w) => w.findAll('button').find((b) => b.text().trim() === 'Modifier')
const refus = (status, reason, extra = {}) => ({ response: { status, data: { success: false, message: SERVEUR, reason } }, ...extra })
// L'option « Sans classe » vaut `null` (v-model) : elle n'a pas d'attribut `value`, le DOM rend alors son TEXTE.
// On lit donc l'option choisie, et on la choisit par son rang.
const SANS_CLASSE = 'Sans classe (aucun élève ne la verra)'
const classeChoisie = (w) => w.find('select[name="classe"]').element.selectedOptions[0]?.textContent.trim()
async function choisirSansClasse(w) {
  const select = w.find('select[name="classe"]')
  select.element.selectedIndex = 0
  await select.trigger('change')
}

async function ouvrir(s = seance({ can_be_edited: true })) {
  const w = monter(s)
  await bouton(w).trigger('click')
  await flushPromises()
  return w
}

beforeEach(() => {
  for (const f of [m.updateSeance, m.fetchTeacherMatieres, m.clearCache, m.clearCacheByPrefix]) f.mockReset()
  m.fetchTeacherMatieres.mockResolvedValue(CATALOGUE)
  m.role.valeur = 'enseignant'
})

describe('#1121 — le bouton suit `can_be_edited`, et rien d’autre', () => {
  it.each([
    ['vrai', true, true],
    ['faux (école KLASSCI, séance passée, visio active, ni auteur ni gestion)', false, false],
    ['absent (serveur sans le champ)', undefined, false],
    ['une valeur qui n’est pas le booléen vrai', 'true', false],
  ])('can_be_edited %s', (_, valeur, visible) => {
    expect(Boolean(bouton(monter(seance({ can_be_edited: valeur }))))).toBe(visible)
  })

  it.each([['etudiant'], ['coordinateur'], ['admin']])('le rôle n’y change rien (%s) : vrai → bouton, faux → aucun', (role) => {
    m.role.valeur = role
    expect(bouton(monter(seance({ can_be_edited: true })))).toBeTruthy()
    expect(bouton(monter(seance({ can_be_edited: false })))).toBeUndefined()
  })

  it('aucun catalogue n’est lu tant que la fenêtre n’est pas ouverte (une carte par séance)', () => {
    monter(seance({ can_be_edited: true }))
    expect(m.fetchTeacherMatieres).not.toHaveBeenCalled()
  })
})

describe('#1121 — la fenêtre de modification', () => {
  it('préremplie : titre, début (heure locale), classe ; la matière est dite, non modifiable', async () => {
    const w = await ouvrir()
    expect(w.find('input[name="titre"]').element.value).toBe('Fractions')
    expect(w.find('input[name="debut"]').element.value).toBe(DEBUT)
    expect(classeChoisie(w)).toBe('6e A')
    expect(w.find('select[name="matiere"]').exists()).toBe(false)
    expect(w.text()).toContain('Mathématiques')
  })

  it('envoie titre, date_seance (avec décalage), classe ; jamais la matière', async () => {
    m.updateSeance.mockResolvedValue({ id: 77, titre: 'Fractions, suite' })
    const w = await ouvrir()
    await w.find('input[name="titre"]').setValue('Fractions, suite')
    await w.find('input[name="debut"]').setValue('2026-11-21T10:00')
    await w.find('select[name="classe"]').setValue('12')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(m.updateSeance).toHaveBeenCalledWith(77, {
      titre: 'Fractions, suite', date_seance: isoAvecDecalage('2026-11-21T10:00'), classe_id: 12, classe_nom: '6e B',
    })
    expect(Object.keys(m.updateSeance.mock.calls[0][1])).not.toContain('matiere_id')
  })

  it('sans classe : classe_id et classe_nom nuls', async () => {
    m.updateSeance.mockResolvedValue({ id: 77 })
    const w = await ouvrir()
    await choisirSansClasse(w)
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(m.updateSeance.mock.calls[0][1]).toMatchObject({ classe_id: null, classe_nom: null })
  })

  it('réussie : les caches des trois écrans sont purgés, la séance relue est émise, la fenêtre se ferme', async () => {
    m.updateSeance.mockResolvedValue({ id: 77, titre: 'Relue' })
    const w = await ouvrir()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(m.clearCache).toHaveBeenCalledWith('teacher_seances')
    expect(m.clearCacheByPrefix).toHaveBeenCalledWith('seances_management_d')
    expect(m.clearCacheByPrefix).toHaveBeenCalledWith('admin_seances_d')
    expect(w.emitted('updated')?.[0]).toEqual([{ id: 77, titre: 'Relue' }])
    expect(w.find('form').exists()).toBe(false)
  })

  it('un titre trop court est refusé avant l’envoi', async () => {
    const w = await ouvrir()
    await w.find('input[name="titre"]').setValue('ab')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(m.updateSeance).not.toHaveBeenCalled()
    expect(w.text()).toContain('Le titre compte de 3 à 255 caractères.')
  })

  it('un seul envoi à la fois', async () => {
    let finir
    m.updateSeance.mockReturnValue(new Promise((r) => { finir = r }))
    const w = await ouvrir()
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    finir({ id: 77 })
    await flushPromises()
    expect(m.updateSeance).toHaveBeenCalledTimes(1)
  })
})

describe('#1121 — les refus sont dits par le catalogue, jamais par le serveur (D0)', () => {
  const KLASSCI = 'Cette séance vient de KLASSCI : elle se modifie dans KLASSCI.'
  const VISIO = 'La visioconférence de cette séance est en cours : elle ne peut pas être modifiée maintenant.'
  // Un motif, un texte (D0) : celui de `seance_past` est juste dans tous ses contextes, la visio comme la modification.
  const PASSEE = 'Cette séance est passée : elle est verrouillée (ni modification, ni visio).'

  it('les deux motifs nouveaux ont leur texte au catalogue ; seance_past, un texte juste partout', () => {
    expect(messageForReason('seance_managed_by_klassci')).toBe(KLASSCI)
    expect(messageForReason('seance_visio_active')).toBe(VISIO)
    expect(messageForReason('seance_past')).toBe(PASSEE)
  })

  it.each([
    [403, 'seance_managed_by_klassci', KLASSCI],
    [409, 'seance_visio_active', VISIO],
    [409, 'seance_past', PASSEE],
  ])('%i %s : le texte, sans « Réessayer »', async (status, reason, texte) => {
    m.updateSeance.mockRejectedValue(refus(status, reason))
    const w = await ouvrir()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toContain(texte)
    expect(w.text()).not.toContain(SERVEUR)
    expect(w.text()).not.toContain('Réessayer')
  })

  it('404 class_out_of_scope : la classe est retirée du formulaire, le motif est dit', async () => {
    m.updateSeance.mockRejectedValue(refus(404, 'class_out_of_scope'))
    const w = await ouvrir()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(classeChoisie(w)).toBe(SANS_CLASSE)
    expect(w.find('[role="alert"]').text()).toContain(messageForReason('class_out_of_scope'))
  })

  it('422 de validation : le message du front sous le champ, jamais celui du serveur', async () => {
    m.updateSeance.mockRejectedValue(refus(422, undefined, { fieldErrors: { titre: [SERVEUR] } }))
    const w = await ouvrir()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.text()).toContain('Le titre compte de 3 à 255 caractères.')
    expect(w.text()).not.toContain(SERVEUR)
  })
})

describe('#1121 — monté sur les trois cartes de séances, la même règle', () => {
  const cartes = [
    ['enseignant (SeanceCard)', (s) => mount(SeanceCard, { props: { seance: s, isEnseignant: true } })],
    ['coordinateur (CoordinatorSeanceCard)', (s) => mount(CoordinatorSeanceCard, { props: { seance: s } })],
    ['gestion (SeancesList)', (s) => mount(SeancesList, { props: { seances: [s] } })],
  ]

  it.each(cartes)('%s : « Modifier » si can_be_edited, aucun sinon ; « updated » remonte', async (_, monterCarte) => {
    expect(bouton(monterCarte(seance({ can_be_edited: false })))).toBeUndefined()
    const w = monterCarte(seance({ can_be_edited: true }))
    expect(bouton(w)).toBeTruthy()
    w.findComponent(SeanceEditAction).vm.$emit('updated', { id: 77 })
    expect(w.emitted('updated')?.[0]).toEqual([{ id: 77 }])
  })
})

describe('#1121 — chaque écran recharge sa liste sur « updated »', () => {
  it.each([
    ['src/views/TeacherSeances.vue', 'SeanceCard'],
    ['src/views/coordinateur/SeanceManagement.vue', 'CoordinatorSeanceCard'],
    ['src/views/admin/AdminSeances.vue', 'SeancesList'],
  ])('%s : <%s … @updated=…>', (vue, carte) => {
    const source = readFileSync(resolve(process.cwd(), vue), 'utf-8')
    expect(source).toMatch(new RegExp(`<${carte}[^>]*?@updated=`))
  })
})

describe('#1121 — saisieLocale : l’inverse de isoAvecDecalage', () => {
  it('un instant ISO devient la saisie « AAAA-MM-JJTHH:mm » à l’heure locale', () => {
    expect(saisieLocale(isoAvecDecalage(DEBUT))).toBe(DEBUT)
    expect(saisieLocale(new Date(2026, 10, 20, 8, 30).toISOString())).toBe(DEBUT)
  })

  it.each([[null], [undefined], [''], ['pas une date']])('%s : null (rien n’est inventé)', (v) => {
    expect(saisieLocale(v)).toBeNull()
  })
})
