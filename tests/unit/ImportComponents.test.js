import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ImportPreviewReport from '@/components/import/ImportPreviewReport.vue'
import ImportJobReport from '@/components/import/ImportJobReport.vue'
import ImportMapping from '@/components/import/ImportMapping.vue'
import { downloadBlob } from '@/utils/downloadBlob'

const rapport = (counts, rows = []) => ({ counts, rows })

describe('ImportPreviewReport (#334)', () => {
  it('affiche les compteurs mesures', () => {
    const wrapper = mount(ImportPreviewReport, {
      props: { report: rapport({ ok: 3, error: 1, total: 4 }) },
    })

    expect(wrapper.text()).toContain('3')
    expect(wrapper.text()).toContain('1')
  })

  it('affiche un tiret plutot qu un zero quand le compteur est absent', () => {
    // « 0 accepté, 0 refusé » sur une mesure absente se lit comme un feu vert.
    const wrapper = mount(ImportPreviewReport, { props: { report: rapport(null) } })

    expect(wrapper.text()).toContain('—')
    expect(wrapper.text()).not.toMatch(/\b0 ligne/)
  })

  it('traduit le statut des lignes', () => {
    const wrapper = mount(ImportPreviewReport, {
      props: {
        report: rapport({ ok: 1, error: 1, total: 2 }, [
          { line: 2, status: 'ok', message: null },
          { line: 3, status: 'error', message: 'Nom et prénom requis.' },
        ]),
      },
    })

    expect(wrapper.text()).toContain('Acceptée')
    expect(wrapper.text()).toContain('Refusée')
    expect(wrapper.text()).not.toContain('error')
  })

  it('rappelle qu aucune ecriture n a eu lieu', () => {
    const wrapper = mount(ImportPreviewReport, {
      props: { report: rapport({ ok: 1, error: 0, total: 1 }) },
    })

    expect(wrapper.text()).toMatch(/rien n'a été écrit/i)
  })

  it('refuse de confirmer tant que l identifiant d import manque', () => {
    const wrapper = mount(ImportPreviewReport, {
      props: { report: rapport({ ok: 1, error: 0, total: 1 }) },
    })

    expect(wrapper.find('[data-test="confirm"]').attributes('disabled')).toBeDefined()
  })

  it('autorise la confirmation des que l identifiant est la', () => {
    const wrapper = mount(ImportPreviewReport, {
      props: { report: { ...rapport({ ok: 1, error: 0, total: 1 }), import_id: 9 } },
    })

    expect(wrapper.find('[data-test="confirm"]').attributes('disabled')).toBeUndefined()
  })
})

describe('ImportJobReport (#334)', () => {
  it('affiche le statut terminal et le motif ligne a ligne', () => {
    const wrapper = mount(ImportJobReport, {
      props: {
        status: 'done',
        counts: { ok: 0, error: 1 },
        rows: [{ line: 3, status: 'error', message: 'téléphone déjà utilisé par Awa Traoré' }],
      },
    })

    expect(wrapper.text()).toMatch(/terminé/i)
    expect(wrapper.text()).toContain('Awa Traoré')
    expect(wrapper.text()).toContain('Refusée')
    expect(wrapper.find('[data-test="export"]').attributes('disabled')).toBeUndefined()
  })

  it('n invente pas de barre de progression : l avancement est le statut serveur', () => {
    const wrapper = mount(ImportJobReport, {
      props: { status: 'queued', counts: { ok: 2, error: 0 }, rows: [], polling: true },
    })

    expect(wrapper.text()).toMatch(/file d'attente/i)
    expect(wrapper.text()).toMatch(/relu sur le serveur/i)
    expect(wrapper.find('progress').exists()).toBe(false)
    expect(wrapper.find('[data-test="export"]').attributes('disabled')).toBeDefined()
  })
})

describe('ImportMapping (#334)', () => {
  const monter = (props = {}) => mount(ImportMapping, {
    props: {
      headers: ['Nom', 'Prenom', 'Tel'],
      mapping: { nom: 'Nom', prenom: 'Prenom', telephone: 'Tel' },
      issues: [],
      loading: false,
      ...props,
    },
  })

  it('autorise l analyse quand rien ne bloque', () => {
    expect(monter().find('[data-test="preview"]').attributes('disabled')).toBeUndefined()
  })

  it('bloque et explique quand la cartographie pose probleme', () => {
    const wrapper = monter({ issues: ['Indiquez la colonne correspondant à : Nom.'] })

    expect(wrapper.find('[data-test="preview"]').attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Indiquez la colonne correspondant à : Nom.')
  })

  it('bloque pendant que l analyse tourne', () => {
    expect(monter({ loading: true }).find('[data-test="preview"]').attributes('disabled')).toBeDefined()
  })

  it('fige la cartographie pendant l analyse', () => {
    // Sinon le rapport qui revient décrit un branchement que l'utilisateur a
    // déjà changé à l'écran : les deux ne parlent plus du même import.
    const selects = monter({ loading: true }).findAll('select')

    expect(selects.every((select) => select.attributes('disabled') !== undefined)).toBe(true)
  })

  it('propose une option par colonne, plus le choix vide', () => {
    const options = monter().find('select').findAll('option')

    expect(options).toHaveLength(4)
    expect(options[0].text()).toBe('—')
  })

  it('associe chaque menu a son libelle de champ', () => {
    const wrapper = monter()
    const select = wrapper.find('select')

    expect(select.attributes('id')).toBeTruthy()
    expect(wrapper.find(`label[for="${select.attributes('id')}"]`).exists()).toBe(true)
  })
})

describe('downloadBlob (#334)', () => {
  it('insere l ancre dans le document avant de cliquer', () => {
    const clicks = []
    const vraiCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = vraiCreate(tag)
      if (tag === 'a') {
        el.click = () => clicks.push(el.isConnected)
      }

      return el
    })
    URL.createObjectURL = vi.fn(() => 'blob:x')
    URL.revokeObjectURL = vi.fn()

    downloadBlob(new Blob(['a;b']), 'modele.csv')

    expect(clicks).toEqual([true])
    expect(document.querySelectorAll('a')).toHaveLength(0)
    vi.restoreAllMocks()
  })
})
