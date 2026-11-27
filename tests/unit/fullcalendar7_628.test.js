// @vitest-environment node
/**
 * #628 — FullCalendar 6 → 7 : UN seul paquet (`@fullcalendar/vue3`), ses plugins et sa locale par sous-chemins, le
 * thème « classic » peint par NOS jetons (sans sa palette en dur), et les deux options renommées par v7.
 *
 * En v7, les classes du DOM sont HACHÉES : un sélecteur `.fc-*` ne vise plus rien. Ce test garde qu'aucun ne revient,
 * et que les 27 variables de la palette « classic » sont toutes posées par nos jetons (une variable oubliée laisserait
 * le calendrier sans couleur, ou retomberait sur une valeur nulle).
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const racine = process.cwd()
const lire = (f) => readFileSync(resolve(racine, f), 'utf8')
const COMPOSABLES = ['src/composables/useCalendarView.js', 'src/composables/useCalendarWidget.js']
const STYLES = ['src/assets/styles/_calendar-fc-tokens.scss', 'src/assets/styles/_calendar-dark.scss', 'src/components/calendar/CalendarView.vue', 'src/components/widgets/CalendarWidget.vue']

// Les 27 variables de `themes/classic/palette.css` (FullCalendar 7.1.5, bloc :root).
const PALETTE_CLASSIC = [
  'background', 'background-event', 'background-event-foreground-opacity', 'background-event-opacity', 'border',
  'button', 'button-border', 'button-foreground', 'button-outline', 'button-strong', 'button-strong-border',
  'event', 'event-contrast', 'faint', 'faint-foreground', 'foreground', 'highlight', 'large-dot-width', 'muted',
  'muted-foreground', 'now', 'primary', 'primary-foreground', 'small-dot-width', 'strong', 'strong-border', 'today',
].map((n) => `--fc-classic-${n}`)

describe('#628 — un seul paquet FullCalendar 7', () => {
  const pkg = JSON.parse(lire('package.json'))

  it('@fullcalendar/vue3 en version 7, et temporal-polyfill (pair exigé par v7)', () => {
    expect(pkg.dependencies['@fullcalendar/vue3']).toMatch(/^\^7\./)
    expect(pkg.dependencies['temporal-polyfill']).toBeDefined()
  })

  it('les paquets v6 séparés sont retirés', () => {
    for (const p of ['@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction']) {
      expect(pkg.dependencies[p]).toBeUndefined()
      expect(pkg.devDependencies?.[p]).toBeUndefined()
    }
  })
})

describe('#628 — les composables du calendrier', () => {
  it.each(COMPOSABLES)('%s : plugins et locale par les sous-chemins de @fullcalendar/vue3, thème classic', (f) => {
    const src = lire(f)
    expect(src).not.toMatch(/from '@fullcalendar\/(core|daygrid|timegrid|interaction)/)
    for (const s of ['daygrid', 'timegrid', 'interaction', 'themes/classic', 'locales/fr']) expect(src).toContain(`from '@fullcalendar/vue3/${s}'`)
    expect(src).toMatch(/plugins: \[classicThemePlugin, /)
    expect(src).toContain("import '@fullcalendar/vue3/skeleton.css'")
    expect(src).toContain("import '@fullcalendar/vue3/themes/classic/theme.css'")
    expect(src).not.toContain('palette.css')
  })

  it.each(COMPOSABLES)('%s : les options portent les noms de v7 (les anciens seraient ignorés en silence)', (f) => {
    const src = lire(f)
    expect(src).toMatch(/\n\s+slotHeaderFormat: \{/)
    expect(src).toMatch(/\n\s+eventClass: \(arg\) =>/)
    expect(src).not.toMatch(/\n\s+slotLabelFormat:/)
    expect(src).not.toMatch(/\n\s+eventClassNames:/)
  })

  it('l’agenda unifié ne montre pas le titre de FullCalendar (son propre en-tête le porte) : par l’OPTION', () => {
    expect(lire('src/composables/useCalendarView.js')).toMatch(/headerToolbar: \{\n\s+left: 'prev,next today',\n\s+center: '',/)
  })
})

describe('#628 — le style passe par nos jetons, jamais par le DOM haché', () => {
  it.each(STYLES)('%s : aucun sélecteur `.fc-*`', (f) => {
    const sansCommentaires = lire(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    expect(sansCommentaires).not.toMatch(/\.fc-[a-zA-Z]/)
  })

  it('les 27 variables de la palette classic sont TOUTES posées par nos jetons', () => {
    const jetons = lire('src/assets/styles/_calendar-fc-tokens.scss')
    for (const v of PALETTE_CLASSIC) expect(jetons).toMatch(new RegExp(`${v}:`))
  })

  it('l’ancien partiel `.fc` sombre a disparu, les deux composants chargent nos jetons', () => {
    expect(() => readFileSync(join(racine, 'src/assets/styles/_calendar-fc-dark.scss'))).toThrow()
    for (const f of ['src/components/calendar/CalendarView.vue', 'src/components/widgets/CalendarWidget.vue']) {
      expect(lire(f)).toContain("@use '../../assets/styles/calendar-fc-tokens';")
    }
  })
})
