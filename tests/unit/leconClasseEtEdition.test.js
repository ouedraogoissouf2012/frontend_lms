/**
 * La classe d'une leçon est CHOISIE par l'enseignant (back #1103), et la leçon se MODIFIE par l'interface (#564).
 * - Mesuré en prod : la matière 1 a trois classes ; la leçon 5 est partie dans la première par ordre de nom, sans
 *   choix (`buildLessonPayload` prenait `classes[0]`). Plusieurs classes : AUCUNE présélection, le choix est requis.
 * - « Modifier » ouvrait les chapitres avec `?edit=true`, que rien ne lit : aucun chemin ne modifiait le titre. La
 *   même modale que la création s'ouvre préremplie, avec la classe, et enregistre par `PUT /lessons/{id}`.
 * - Le refus du serveur (422, reason `classe_hors_matiere`) est dit par le CATALOGUE, jamais par son texte (D0).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const lesson = vi.hoisted(() => ({ getLesson: vi.fn(), updateLesson: vi.fn(), createLesson: vi.fn() }))
vi.mock('@/services/lesson', () => ({ default: lesson }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 42, role: 'enseignant' }) } }))

import { createEmptyLesson, buildLessonPayload, buildLessonUpdatePayload, leconVersFormulaire } from '@/utils/matiereDetails'
import CreateLessonModal from '@/components/matieres/CreateLessonModal.vue'
import { useLessonModal } from '@/composables/useLessonModal'
import { messageForReason } from '@/services/errorHandler'

const CLASSE_HORS_MATIERE = 'Cette classe n’est pas une classe de la matière.'
const SERVEUR = 'Texte brut du serveur, jamais affiché'
const DEUX = [{ id: 2, nom: '5e B' }, { id: 1, nom: '6e A' }]

beforeEach(() => { Object.values(lesson).forEach((fn) => fn.mockReset()) })

describe('utils/matiereDetails — la classe choisie', () => {
  it('une seule classe : présélectionnée ; plusieurs ou aucune : aucune présélection', () => {
    expect(createEmptyLesson([{ id: 4 }]).classe_id).toBe(4)
    expect(createEmptyLesson(DEUX).classe_id).toBeNull()
    expect(createEmptyLesson([]).classe_id).toBeNull()
    expect(createEmptyLesson().classe_id).toBeNull()
  })

  it('buildLessonPayload envoie la classe CHOISIE, jamais la première des classes de la matière', () => {
    expect(buildLessonPayload({ title: 'T', classe_id: 1 }, { user: { id: 42 }, matiereIdLocal: 3 }).classe_id).toBe(1)
    expect(buildLessonPayload({ title: 'T', classe_id: null }, { classes: DEUX, user: { id: 42 }, matiereIdLocal: 3 }).classe_id).toBeNull()
  })

  it('la modification n’envoie que les champs du formulaire, avec la classe', () => {
    const forme = { title: 'T', description: 'D', prerequis: 'P', niveau_difficulte: 'avance', objectifs_pedagogiques: 'O', duree_estimee_minutes: 30, classe_id: 1 }
    expect(buildLessonUpdatePayload({ ...forme, status: 'published', id: 5, enseignant_id: 9 })).toEqual(forme)
  })

  it('une leçon lue devient le formulaire prérempli (sa classe actuelle comprise)', () => {
    expect(leconVersFormulaire({ id: 5, title: 'T', description: null, classe_id: 2, status: 'draft' })).toEqual({
      title: 'T', description: '', prerequis: '', niveau_difficulte: 'debutant', objectifs_pedagogiques: '', duree_estimee_minutes: null, classe_id: 2,
    })
  })
})

describe('CreateLessonModal — le champ Classe', () => {
  const monter = (props = {}) => mount(CreateLessonModal, {
    props: { visible: true, lesson: createEmptyLesson(props.classes ?? []), creating: false, classes: [], ...props },
    global: { stubs: { teleport: true } },
  })
  const bouton = (w) => w.findAll('button').find((b) => /Créer la leçon|Enregistrer/.test(b.text()))

  it('une classe : présélectionnée et VISIBLE (l’enseignant voit où part sa leçon)', () => {
    const w = monter({ classes: [{ id: 4, nom: '6e A' }], lesson: { ...createEmptyLesson([{ id: 4 }]), title: 'T' } })
    expect(w.find('select#lecon-classe').element.value).toBe('4')
    expect(w.find('label[for="lecon-classe"]').text()).toContain('Classe')
  })

  it('plusieurs classes : aucune présélection, le bouton reste désactivé tant qu’on n’a pas choisi', async () => {
    const lecon = { ...createEmptyLesson(DEUX), title: 'T' }
    const w = monter({ classes: DEUX, lesson: lecon })
    expect(w.find('select#lecon-classe').element.value).toBe('')
    expect(bouton(w).attributes('disabled')).toBeDefined()
    await w.find('select#lecon-classe').setValue('1')
    expect(lecon.classe_id).toBe(1)
  })

  it('aucune classe : le message le dit, et rien ne peut être créé', () => {
    const w = monter({ classes: [], lesson: { ...createEmptyLesson([]), title: 'T' } })
    expect(w.text()).toContain('Cette matière n’a aucune classe : la leçon ne peut pas être créée.')
    expect(bouton(w).attributes('disabled')).toBeDefined()
  })

  it('en modification : son titre et son bouton le disent', () => {
    const w = monter({ classes: DEUX, editing: true, lesson: { ...createEmptyLesson(DEUX), title: 'T', classe_id: 2 } })
    expect(w.text()).toContain('Modifier la leçon')
    expect(bouton(w).text()).toContain('Enregistrer')
  })

  it('les libellés sont associés à leurs champs (#563)', () => {
    const w = monter({ classes: DEUX })
    for (const id of ['lecon-titre', 'lecon-description', 'lecon-classe', 'lecon-prerequis', 'lecon-niveau', 'lecon-objectifs', 'lecon-duree']) {
      expect(w.find(`label[for="${id}"]`).exists()).toBe(true)
      expect(w.find(`#${id}`).exists()).toBe(true)
    }
  })

  it('le refus de la classe est dit sous le champ', () => {
    expect(monter({ classes: DEUX, erreurClasse: CLASSE_HORS_MATIERE }).text()).toContain(CLASSE_HORS_MATIERE)
  })
})

describe('useLessonModal — créer et modifier', () => {
  const notifier = vi.fn()
  const recharger = vi.fn()
  const versChapitres = vi.fn()
  const preparer = (classes = DEUX) => {
    let api
    mount(defineComponent({ setup() { api = useLessonModal({ classes: ref(classes), matiereIdLocal: ref(3), notifier, recharger, versChapitres }); return () => null } }))
    return api
  }
  beforeEach(() => { [notifier, recharger, versChapitres].forEach((f) => f.mockReset()) })

  it('« Modifier » ouvre la modale préremplie depuis la leçon LUE', async () => {
    lesson.getLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'Ancien', classe_id: 2 } })
    const api = preparer()
    await api.ouvrirEdition(5)
    expect(lesson.getLesson).toHaveBeenCalledWith(5)
    expect(api.visible.value).toBe(true)
    expect(api.enEdition.value).toBe(5)
    expect(api.lecon.value).toMatchObject({ title: 'Ancien', classe_id: 2 })
  })

  it('l’enregistrement modifie par PUT, avec le titre et la classe, puis recharge', async () => {
    lesson.getLesson.mockResolvedValue({ success: true, data: { id: 5, title: 'Ancien', classe_id: 2 } })
    lesson.updateLesson.mockResolvedValue({ success: true, data: { id: 5 } })
    const api = preparer()
    await api.ouvrirEdition(5)
    api.lecon.value.title = 'Nouveau'
    api.lecon.value.classe_id = 1
    await api.enregistrer()
    expect(lesson.updateLesson).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Nouveau', classe_id: 1 }))
    expect(recharger).toHaveBeenCalled()
    expect(api.visible.value).toBe(false)
  })

  it('créer sans classe choisie : rien ne part, l’écran le demande', async () => {
    const api = preparer()
    api.ouvrirCreation()
    api.lecon.value.title = 'T'
    await api.enregistrer()
    expect(lesson.createLesson).not.toHaveBeenCalled()
    expect(notifier).toHaveBeenCalledWith('Choisissez la classe de la leçon', 'warning')
  })

  it('créer avec la classe choisie : elle part, puis les chapitres', async () => {
    lesson.createLesson.mockResolvedValue({ success: true, data: { id: 8 } })
    const api = preparer()
    api.ouvrirCreation()
    Object.assign(api.lecon.value, { title: 'T', classe_id: 1 })
    await api.enregistrer()
    expect(lesson.createLesson).toHaveBeenCalledWith(expect.objectContaining({ classe_id: 1, matiere_id: 3, enseignant_id: 42 }))
    expect(versChapitres).toHaveBeenCalledWith(8)
  })

  it('le 422 « classe_hors_matiere » : le texte du CATALOGUE sous le champ, jamais celui du serveur', async () => {
    lesson.createLesson.mockRejectedValue({ response: { status: 422, data: { reason: 'classe_hors_matiere', message: SERVEUR, errors: { classe_id: [SERVEUR] } } } })
    const api = preparer()
    api.ouvrirCreation()
    Object.assign(api.lecon.value, { title: 'T', classe_id: 1 })
    await api.enregistrer()
    await flushPromises()
    expect(api.erreurClasse.value).toBe(CLASSE_HORS_MATIERE)
    expect(JSON.stringify(notifier.mock.calls)).not.toContain(SERVEUR)
  })

  it('le motif est au catalogue', () => {
    expect(messageForReason('classe_hors_matiere')).toBe(CLASSE_HORS_MATIERE)
  })
})

describe('le second formulaire de « Mes leçons » est retiré', () => {
  it('LessonFormModal et useLessonForm n’existent plus, et TeacherLessons ne les monte plus', () => {
    expect(existsSync('src/components/lessons/LessonFormModal.vue')).toBe(false)
    expect(existsSync('src/composables/useLessonForm.js')).toBe(false)
    expect(readFileSync('src/views/lessons/TeacherLessons.vue', 'utf8')).not.toMatch(/LessonFormModal|showCreateModal/)
  })
})
