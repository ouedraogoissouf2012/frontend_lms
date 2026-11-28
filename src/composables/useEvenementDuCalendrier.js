import { reactive, ref } from 'vue'
import { calendrierService } from '@/services/calendrier'
import { useConfirm } from '@/composables/useConfirm'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const vide = () => ({ ouvert: false, id: null, type: 'autre', titre: '', debut: '', fin: '', portee: 'ecole', classeIds: [] })

/** Les champs que le serveur nomme dans un 422, et le champ de l'écran qui les montre. */
const CHAMP_DU_SERVEUR = Object.freeze({ type: 'type', titre: 'titre', debut: 'dates', fin: 'dates', classe_ids: 'portee' })

/**
 * Publier, modifier et supprimer un événement du calendrier (#678), pour la gestion. La saisie est vérifiée avant
 * l'envoi (titre, jours ordonnés, au moins une classe si la portée est « classes choisies ») ; le serveur garde le
 * dernier mot : un 422 par champ se range sous son champ, un motif (`classe_hors_ecole`) ou un 403 est dit par le
 * catalogue, jamais par le texte du serveur. Après chaque écriture, le mois est relu (`apres`).
 *
 * @param {{ apres: () => Promise<void>, annonce: import('vue').Ref<string> }} options
 */
export function useEvenementDuCalendrier({ apres, annonce }) {
  const saisie = reactive(vide())
  const erreurs = reactive({ type: '', titre: '', dates: '', portee: '' })
  const erreurEcriture = ref('')
  const occupe = ref(false)

  function effacer() {
    Object.assign(erreurs, { type: '', titre: '', dates: '', portee: '' })
    erreurEcriture.value = ''
  }

  function ouvrir(e = null) {
    effacer()
    Object.assign(saisie, vide(), { ouvert: true }, e
      ? { id: e.id, type: e.type, titre: e.titre, debut: e.debut, fin: e.fin, portee: e.portee, classeIds: [...e.classe_ids] }
      : {})
  }

  const fermer = () => Object.assign(saisie, vide())

  function verifier() {
    effacer()
    if (!saisie.titre.trim()) erreurs.titre = ERROR_MESSAGES.calendrierTitreRequis
    if (!saisie.debut || !saisie.fin) erreurs.dates = ERROR_MESSAGES.calendrierDatesRequises
    else if (saisie.fin < saisie.debut) erreurs.dates = ERROR_MESSAGES.calendrierFinAvantDebut
    if (saisie.portee === 'classes' && saisie.classeIds.length === 0) erreurs.portee = ERROR_MESSAGES.calendrierClassesRequises
    return !erreurs.titre && !erreurs.dates && !erreurs.portee
  }

  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ') || ERROR_MESSAGES.validation
        if (CHAMP_DU_SERVEUR[cle]) erreurs[CHAMP_DU_SERVEUR[cle]] = texte
        else erreurEcriture.value = texte
      }
      return
    }
    erreurEcriture.value = err?.userMessage || ERROR_MESSAGES.unknown
  }

  async function ecrire(action, texte) {
    if (occupe.value) return
    occupe.value = true
    annonce.value = ''
    try {
      await action()
      annonce.value = texte
      fermer()
      await apres()
    } catch (err) {
      ranger(err)
    } finally {
      occupe.value = false
    }
  }

  function enregistrer() {
    if (!verifier()) return Promise.resolve()
    const envoi = { type: saisie.type, titre: saisie.titre, debut: saisie.debut, fin: saisie.fin, classeIds: saisie.portee === 'classes' ? saisie.classeIds : [] }
    return saisie.id
      ? ecrire(() => calendrierService.modifier(saisie.id, envoi), 'Événement modifié.')
      : ecrire(() => calendrierService.publier(envoi), 'Événement publié.')
  }

  async function supprimer(e) {
    effacer()
    const ok = await useConfirm().confirm({ title: 'Supprimer cet événement', message: `« ${e.titre} » disparaît du calendrier de l’année.`, confirmLabel: 'Supprimer', variant: 'danger' })
    if (ok) await ecrire(() => calendrierService.supprimer(e.id), 'Événement supprimé.')
  }

  return { saisie, erreurs, erreurEcriture, occupe, ouvrir, fermer, enregistrer, supprimer }
}
