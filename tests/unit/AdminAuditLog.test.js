/**
 * Écran « Journal d'audit » du supradmin (/admin/audit-log, ARRÊT 1, D126/D127).
 *
 * Ce qu'il doit DIRE : date, acteur (nom et rôle en français), action et élément en français,
 * école (son nom, sinon « École n° id »). Une valeur hors table rend « — ». Jamais un code du
 * serveur (`login_failed`), un nom de classe PHP, ni l'e-mail de l'acteur ; l'IP et le navigateur
 * seulement dans le détail repliable (Q2). Le diff avant/après est un REPORT DE PÉRIMÈTRE (Q3).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AUDIT_LOG_CAPTURE, CONNEXION, COPIE_MODIFIEE, ECHEC_CONNEXION, INCONNUE, pageDuJournal } from '../fixtures/auditLog'

const h = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/services/auditLog', () => ({ auditLogService: { list: (...a) => h.list(...a) } }))

import AdminAuditLog from '@/views/admin/AdminAuditLog.vue'

const stubs = { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: { template: '<div class="loader" />' } }
async function monter() {
  const w = mount(AdminAuditLog, { global: { stubs } })
  await flushPromises()
  return w
}
const refus = (status, userMessage) => Object.assign(new Error('refus'), { response: { status }, userMessage })

describe('AdminAuditLog — ce que l’écran dit', () => {
  beforeEach(() => { h.list.mockReset() })

  it('chaque entrée en français : acteur et rôle, action, élément, école', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION, COPIE_MODIFIEE, ECHEC_CONNEXION], { last_page: 3, total: 120 }))
    const lignes = (await monter()).findAll('tr.entree').map((l) => l.text())
    expect(lignes[0]).toContain('Awa Essai')
    expect(lignes[0]).toContain('Enseignant')
    expect(lignes[0]).toContain('Connexion')
    expect(lignes[0]).toContain('Collège Fictif Horizon')
    expect(lignes[1]).toContain('Modification')
    expect(lignes[1]).toContain('Copie d’évaluation n° 31')
    expect(lignes[1]).toContain('École n° 9')
    expect(lignes[2]).toContain('Échec de connexion')
  })

  it('la réponse CAPTURÉE (#1014) : en français, sans code, sans e-mail, la pagination lue', async () => {
    h.list.mockResolvedValue(AUDIT_LOG_CAPTURE)
    const w = await monter()
    const [echec, visio] = w.findAll('tr.entree').map((l) => l.text())
    expect(echec).toContain('Échec de connexion')
    expect(visio).toContain('Awa Koné')
    expect(visio).toContain('Enregistrement visio démarré')
    expect(visio).toContain('Enregistrement visio n° 12')
    expect(visio).toContain('Collège Les Palmiers')
    for (const brut of ['visio_recording_start', 'login_failed', 'SeanceRecording', 'awa.kone@exemple.test']) {
      expect(w.text()).not.toContain(brut)
    }
    expect(w.find('.pagination').text()).toContain('Page 1 sur 1')
    expect(w.find('.pagination').text()).toContain('2 entrées')
  })

  it('jamais un code du serveur, un nom de classe ni l’e-mail ; l’inconnu rend « — »', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION, COPIE_MODIFIEE, ECHEC_CONNEXION, INCONNUE]))
    const w = await monter()
    const texte = w.text()
    for (const brut of ['login_failed', 'teleport', 'App\\Models', 'EvaluationSubmission', 'awa@exemple.test', 'koffi@exemple.test']) {
      expect(texte).not.toContain(brut)
    }
    expect(w.findAll('tr.entree')[3].text()).toContain('—')
  })

  it('l’IP et le navigateur seulement dans le détail repliable', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION]))
    const ligne = (await monter()).find('tr.entree')
    const detail = ligne.find('details')
    expect(detail.text()).toContain('203.0.113.5')
    expect(detail.text()).toContain('Mozilla/5.0 (Essai)')
    const horsDetail = ligne.findAll('td').filter((td) => !td.find('details').exists()).map((td) => td.text()).join(' ')
    expect(horsDetail).not.toContain('203.0.113.5')
  })

  it('pagination en page 2 sur 2 : Précédent actif, Suivant inactif ; « 1 entrée » au singulier', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION], { current_page: 2, last_page: 2, total: 51 }))
    const w = await monter()
    expect(w.find('.page-precedente').attributes('aria-disabled')).toBe('false')
    expect(w.find('.page-suivante').attributes('aria-disabled')).toBe('true')
    h.list.mockResolvedValue(pageDuJournal([CONNEXION], { total: 1 }))
    await w.find('#filtre-action').setValue('login')
    await flushPromises()
    expect(w.find('.pagination').text()).toContain('1 entrée')
    expect(w.find('.pagination').text()).not.toContain('1 entrées')
  })

  // Revue de #512 : une région `role=status` créée remplie n'est pas annoncée ; elle existe dès le montage.
  it('le chargement est ANNONCÉ dans une région présente dès le montage', async () => {
    let fin
    h.list.mockImplementationOnce(() => new Promise((r) => { fin = r }))
    const w = mount(AdminAuditLog, { global: { stubs } })
    await w.vm.$nextTick()
    expect(w.find('[role="status"]').text()).toBe('Chargement du journal…')
    fin(pageDuJournal([CONNEXION]))
    await flushPromises()
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.find('[role="status"]').text()).toBe('')
    h.list.mockImplementationOnce(() => new Promise(() => {}))
    await w.find('#filtre-action').setValue('login')
    expect(w.find('[role="status"]').text()).toBe('Mise à jour…')
  })

  it('le tableau a une légende ; chaque détail se distingue au lecteur d’écran', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION, COPIE_MODIFIEE]))
    const w = await monter()
    expect(w.find('table caption').text()).toBe('Entrées du journal, de la plus récente à la plus ancienne')
    expect(w.findAll('summary').map((s) => s.attributes('aria-label')))
      .toEqual(['Provenance de l’entrée n° 11', 'Provenance de l’entrée n° 12'])
  })

  it('pagination : « Page 1 sur 3 », Précédent inactif, Suivant charge la page 2', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION], { current_page: 1, last_page: 3, total: 120 }))
    const w = await monter()
    expect(w.find('.pagination').text()).toContain('Page 1 sur 3')
    expect(w.find('.pagination').text()).toContain('120 entrées')
    expect(w.find('.page-precedente').attributes('aria-disabled')).toBe('true')
    await w.find('.page-suivante').trigger('click')
    expect(h.list).toHaveBeenLastCalledWith({ page: 2, action: '', userId: null })
  })

  it('filtres : la liste d’actions, et un clic sur l’acteur montre ses actions', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION]))
    const w = await monter()
    const options = w.findAll('#filtre-action option').map((o) => o.text())
    expect(options).toEqual(['Toutes', 'Création', 'Modification', 'Suppression', 'Consultation', 'Export', 'Import', 'Connexion', 'Déconnexion', 'Échec de connexion'])
    await w.find('#filtre-action').setValue('login_failed')
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login_failed', userId: null })
    await w.find('.acteur-filtre').trigger('click')
    await flushPromises()
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login_failed', userId: 4 })
    expect(w.find('.filtre-acteur').text()).toContain('Awa Essai')
    await w.find('.filtre-acteur button').trigger('click')
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login_failed', userId: null })
  })

  it('vide après succès : le texte dit lequel ; aucun tableau', async () => {
    h.list.mockResolvedValue(pageDuJournal([], { total: 0 }))
    const w = await monter()
    expect(w.find('.journal-vide').text()).toBe('Aucune entrée dans le journal.')
    expect(w.find('table').exists()).toBe(false)
    await w.find('#filtre-action').setValue('export')
    await flushPromises()
    expect(w.find('.journal-vide').text()).toBe('Aucune entrée pour ce filtre.')
  })

  it('erreur : le motif, jamais « vide » ; « Réessayer » sur une panne, pas sur un refus', async () => {
    h.list.mockRejectedValue(refus(503, 'Le service est momentanément indisponible.'))
    const w = await monter()
    expect(w.find('[role="alert"]').text()).toBe('Le service est momentanément indisponible.')
    expect(w.find('.journal-vide').exists()).toBe(false)
    expect(w.find('.btn-reessayer').exists()).toBe(true)
    h.list.mockRejectedValue(refus(403, 'Accès refusé.'))
    await w.find('.btn-reessayer').trigger('click')
    // Revue de #512 : « Réessayer » rejoue la requête qui a échoué (ici, la page 1 du montage).
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: '', userId: null })
    await flushPromises()
    expect(w.find('.btn-reessayer').exists()).toBe(false)
  })
})
