/**
 * #613 : « Mot de passe oublié » affichait « Si un compte existe, un courriel a été envoyé. » à chaque 200, quoi que dise
 * le serveur ; aucun courriel ne partait (lms_backend#808). Le back répond désormais par un motif, le même pour un compte
 * connu ou inconnu (lms_backend#1308) :
 *   - `mot_de_passe_klassci` : école KLASSCI, le mot de passe se réinitialise dans KLASSCI (information) ;
 *   - `reinitialisation_indisponible` : école autonome, canal de courriel non posé, rien ne part (information) ;
 *   - `lien_envoye` : école autonome, canal posé, un lien part si le compte existe (succès).
 * L'écran affiche le texte du CATALOGUE du front (D0), jamais celui du serveur ; un motif absent ou inconnu rend un texte
 * neutre, qui ne promet aucun envoi.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { REASONS, entreeDuMotif, estInformation } from '@/services/refusalReasons'
import { messageForReason } from '@/services/errorHandler'

vi.mock('@/services/api', () => ({
  auth: { getActiveInstitutions: vi.fn().mockResolvedValue([{ slug: 'ecole-test', name: 'École fictive' }]) },
}))
const requestLink = vi.fn()
vi.mock('@/services/passwordReset', () => ({
  passwordResetService: { requestLink: (...a) => requestLink(...a), resetPassword: vi.fn() },
}))

import { usePasswordReset } from '@/composables/usePasswordReset'
import ForgotPassword from '@/views/ForgotPassword.vue'

const TEXTE_SERVEUR = 'Texte serveur, jamais affiché'
const repondre = (reason) => requestLink.mockResolvedValue({ success: true, ...(reason === undefined ? {} : { reason }), message: TEXTE_SERVEUR })

const MOTIFS = [
  ['mot_de_passe_klassci', 'motDePasseKlassci', 'information'],
  ['reinitialisation_indisponible', 'reinitialisationIndisponible', 'information'],
  ['lien_envoye', 'lienDeReinitialisationEnvoye', 'succes'],
]

beforeEach(() => {
  requestLink.mockReset()
})

describe('#613 — le catalogue des motifs porte les trois réponses du serveur', () => {
  it.each(MOTIFS)('%s : sa catégorie, son texte du front, et une information (jamais une erreur)', (reason, categorie) => {
    expect(entreeDuMotif(reason)).toMatchObject({ categorie, transitoire: false, information: true })
    expect(typeof ERROR_MESSAGES[categorie]).toBe('string')
    expect(messageForReason(reason)).toBe(ERROR_MESSAGES[categorie])
    expect(estInformation(reason)).toBe(true)
  })

  it('un motif de refus n’est pas une information ; un motif inconnu ou absent non plus', () => {
    expect(estInformation('visio_ended')).toBe(false)
    expect(estInformation('motif_inconnu')).toBe(false)
    expect(estInformation(undefined)).toBe(false)
    expect(Object.values(REASONS).filter((e) => e.information).map((e) => e.categorie).sort())
      .toEqual(MOTIFS.map(([, c]) => c).sort())
  })

  it('aucun texte ne promet un courriel déjà envoyé ; seul `lien_envoye` parle d’un lien, au conditionnel du compte', () => {
    for (const [, categorie] of MOTIFS) expect(ERROR_MESSAGES[categorie]).not.toMatch(/a été envoyé/i)
    expect(ERROR_MESSAGES.lienDeReinitialisationEnvoye).toMatch(/^Si un compte correspond à cette adresse/)
    expect(ERROR_MESSAGES.motDePasseKlassci).toMatch(/KLASSCI/)
    expect(ERROR_MESSAGES.reinitialisationIndisponible).not.toMatch(/envoy/i)
    expect(ERROR_MESSAGES.demandeDeReinitialisationRecue).not.toMatch(/envoy|courriel|lien/i)
  })
})

describe('#613 — usePasswordReset affiche le texte du motif, avec son ton', () => {
  it.each(MOTIFS)('%s → le texte du catalogue, ton %s', async (reason, categorie, ton) => {
    repondre(reason)
    const api = usePasswordReset()
    await expect(api.requestLink('ecole-test', 'eleve@ecole.test')).resolves.toBe(true)
    expect(api.notice.value).toBe(ERROR_MESSAGES[categorie])
    expect(api.noticeTone.value).toBe(ton === 'succes' ? 'succes' : 'information')
    expect(api.notice.value).not.toContain(TEXTE_SERVEUR)
  })

  it('motif absent, inconnu, ou motif de REFUS dans un 200 : le texte neutre, en information, sans promesse', async () => {
    for (const reason of [undefined, 'motif_inconnu', 'visio_ended']) {
      repondre(reason)
      const api = usePasswordReset()
      await api.requestLink('ecole-test', 'eleve@ecole.test')
      expect(api.notice.value).toBe(ERROR_MESSAGES.demandeDeReinitialisationRecue)
      expect(api.noticeTone.value).toBe('information')
    }
  })

  it('une nouvelle demande efface le ton de la précédente', async () => {
    const api = usePasswordReset()
    repondre('lien_envoye')
    await api.requestLink('ecole-test', 'eleve@ecole.test')
    requestLink.mockRejectedValue({ userMessage: 'Panne' })
    await api.requestLink('ecole-test', 'eleve@ecole.test')
    expect([api.notice.value, api.noticeTone.value, api.error.value]).toEqual(['', '', 'Panne'])
  })
})

describe('#613 — l’écran dit l’information autrement que le succès', () => {
  const RouterLink = { template: '<a><slot /></a>' }
  const soumettre = async (reason) => {
    repondre(reason)
    const vue = mount(ForgotPassword, { global: { stubs: { RouterLink } } })
    await flushPromises()
    await vue.find('#institution').setValue('ecole-test')
    await vue.find('#email').setValue('eleve@ecole.test')
    await vue.find('form').trigger('submit')
    await flushPromises()
    return vue.find('[role="status"]')
  }

  it('reinitialisation_indisponible : une région « status », en information (pas le vert du succès)', async () => {
    const statut = await soumettre('reinitialisation_indisponible')
    expect(statut.text()).toBe(ERROR_MESSAGES.reinitialisationIndisponible)
    expect(statut.classes()).toContain('bg-blue-100')
    expect(statut.classes()).not.toContain('bg-green-100')
  })

  it('lien_envoye : une région « status », en succès', async () => {
    const statut = await soumettre('lien_envoye')
    expect(statut.text()).toBe(ERROR_MESSAGES.lienDeReinitialisationEnvoye)
    expect(statut.classes()).toContain('bg-green-100')
  })
})

describe('#613 — plus aucune promesse d’envoi écrite en dur', () => {
  const fichiers = (dossier) => readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin]
  })

  it('« courriel a été envoyé » est introuvable dans src/', () => {
    const trouves = fichiers(resolve(process.cwd(), 'src'))
      .filter((f) => /\.(js|vue|mjs|ts)$/.test(f))
      .filter((f) => /courriel a été envoyé/i.test(readFileSync(f, 'utf8')))
    expect(trouves).toEqual([])
  })
})
