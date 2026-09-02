/**
 * TeacherClassCard — ouverture de la classe et honnêteté des compteurs.
 *
 * Deux défauts constatés sur /teacher/classes :
 *
 *  1. La carte affichait une icône « œil » suivie du nom, et un `title` promettant
 *     « Afficher les détails de… », sans aucun `@click`, `emit` ni lien. Elle
 *     ressemblait à un lien sans en être un — l'enseignant ne pouvait pas ouvrir
 *     sa classe. La route `/classes/:id` lui est pourtant ouverte
 *     (`academic.routes.js` : `AUTHENTICATED_ROLES` inclut `enseignant`) et l'API
 *     lui répond 200 avec le roster (mesuré : 6 étudiants sur la classe 1).
 *
 *  2. « Étudiants 0/30 » sur une classe qui en compte 6. Les DEUX nombres étaient
 *     fabriqués en amont par `enrichTeacherClasses` : `0` via le `?? 0` de
 *     `getClassStudentCount`, `30` via un `?? 30` codé en dur. La source
 *     (/proxy/me/teacher-dashboard) ne porte ni effectif ni capacité.
 */
import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TeacherClassCard from '@/components/teacher/TeacherClassCard.vue'

const MESUREE = {
  id: 1, name: 'B2 COM',
  niveau: { nom: 'BTS 1ere ANNEE' },
  filiere: { nom: 'BATIMENT', code: 'BTP' },
  is_active: true, places_occupees: 6, places_totales: 30, nb_matieres: 3,
}

/** Forme réelle du dashboard enseignant : aucune de ces trois clés n'existe. */
const NON_MESUREE = {
  id: 1, name: 'B2 COM', libelle: null,
  niveau: { nom: 'BTS 1ere ANNEE' },
  filiere: { nom: 'BATIMENT', code: 'BTP' },
  places_occupees: null, places_totales: null, nb_matieres: null,
}

const monter = (classe) => mount(TeacherClassCard, {
  props: { classe },
  global: { stubs: { RouterLink: RouterLinkStub } },
})

describe('TeacherClassCard — ouverture de la classe', () => {
  it('mene vers le detail de la classe', () => {
    const lien = monter(MESUREE).findComponent(RouterLinkStub)

    expect(lien.exists()).toBe(true)
    // Route nommée plutôt qu'URL en dur : le chemin reste modifiable en un seul endroit.
    expect(lien.props().to).toEqual({ name: 'classe-details', params: { id: 1 } })
  })

  it('rend TOUTE la carte cliquable, pas seulement une icone', () => {
    const w = monter(MESUREE)
    const lien = w.findComponent(RouterLinkStub)

    // La cible de clic doit porter la carte entière : viser une icône de 20 px
    // est un obstacle réel, en particulier au doigt sur écran tactile.
    expect(lien.classes()).toContain('class-card')
    expect(lien.text()).toContain('B2 COM')
  })

  it('reste actionnable au clavier', () => {
    // `RouterLink` rend un `<a href>` natif : focusable et activable par Entrée
    // sans gestionnaire ajouté. Un `div` avec `@click` aurait exigé `tabindex`,
    // `role` et un `@keydown.enter` — trois occasions de l'oublier.
    const lien = monter(MESUREE).findComponent(RouterLinkStub)

    expect(lien.element.tagName.toLowerCase()).toBe('a')
  })
})

describe('TeacherClassCard — compteurs mesures ou tus', () => {
  it('affiche les valeurs reellement mesurees', () => {
    const w = monter(MESUREE)

    expect(w.text()).toContain('6/30')
    expect(w.text()).toContain('3')
  })

  it('affiche un tiret, jamais un zero, quand la donnee est absente', () => {
    const w = monter(NON_MESUREE)

    const effectif = w.find('.stat-value').text()
    expect(effectif).toBe('—/—')
    // Le piège exact du défaut : « 0/30 » se lisait comme une classe vide de
    // 30 places, alors que rien n'avait été mesuré.
    expect(w.text()).not.toContain('0/30')
    expect(w.text()).not.toContain('0/0')
  })

  it('ne promet pas un effectif dans son infobulle quand rien n est mesure', () => {
    const w = monter(NON_MESUREE)
    const infobulle = w.findAll('.stat-item')[0].attributes('title')

    expect(infobulle).not.toContain('0 étudiants')
  })
})
