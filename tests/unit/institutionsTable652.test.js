/**
 * #652 — le tableau des institutions (écran du supradmin) était coupé à droite sur écran large : `.table-container`
 * en `overflow: hidden`, défilement réservé aux écrans de moins de 1024 px. Attendu : le cadre défile à TOUTE largeur,
 * et la colonne Actions reste collée à droite (`position: sticky`), donc visible et cliquable sans défiler.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InstitutionsTable from '@/components/admin/InstitutionsTable.vue'

const source = readFileSync(resolve(process.cwd(), 'src/components/admin/InstitutionsTable.vue'), 'utf8').replaceAll('\r\n', '\n')
const style = source.slice(source.indexOf('<style'))
/** Le style hors de tout bloc @media : ce qui vaut sur écran large. */
const horsMedia = style.replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')

/** Le corps de la règle qui commence une ligne par `selecteur {`, ou ''. Recherche simple, sans RegExp construite. */
function regle(css, selecteur) {
  const debut = css.indexOf(`\n${selecteur} {`)
  if (debut === -1) return ''
  const ouverture = css.indexOf('{', debut)
  return css.slice(ouverture + 1, css.indexOf('}', ouverture))
}

const ECOLE = {
  id: 1, name: 'Ecole fictive 652', slug: 'ecole-fictive-652', is_active: true, primary_color: null,
  api_url: 'https://une-adresse-tres-longue-pour-une-ecole-fictive.example.test/api',
  stats: { users_count: 10, lessons_count: 4, evaluations_count: 1, last_activity: null },
}

describe('#652 — le tableau des institutions ne coupe plus sa colonne Actions', () => {
  it('l’outil de lecture trouve bien une règle existante (garde contre un faux vert)', () => {
    expect(regle(horsMedia, '.institutions-table')).toMatch(/border-collapse:\s*collapse/)
  })

  it('sur écran large (hors @media), le cadre défile à l’horizontale au lieu de couper', () => {
    expect(regle(horsMedia, '.table-container')).toMatch(/overflow-x:\s*auto/)
    expect(regle(horsMedia, '.table-container')).not.toMatch(/overflow:\s*hidden/)
  })

  it('l’en-tête ET les cellules Actions portent la classe col-actions', () => {
    const w = mount(InstitutionsTable, { props: { institutions: [ECOLE] } })
    expect(w.find('thead th.col-actions').text()).toBe('Actions')
    expect(w.find('tbody td.col-actions .actions-cell').exists()).toBe(true)
  })

  it('la colonne Actions reste collée à droite, sur un fond opaque', () => {
    const r = regle(horsMedia, '.col-actions')
    expect(r).toMatch(/position:\s*sticky/)
    expect(r).toMatch(/right:\s*0/)
    expect(r).toMatch(/background:\s*var\(--card-bg\)/)
  })
})
