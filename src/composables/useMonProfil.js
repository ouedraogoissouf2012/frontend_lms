import { reactive, ref } from 'vue'
import { monCompteService } from '@/services/monCompte'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useAuthStore } from '@/stores/auth'

/**
 * Modifier SON profil (#674, lms_backend#1667), `PATCH /auth/me` : le nom affiché et le téléphone. Le courriel n'est
 * pas modifiable ici (l'identifiant de connexion ; autre issue).
 *
 * La saisie part du compte connecté. Contrôle local : le nom est exigé. Un téléphone vide est envoyé NUL (il
 * l'efface). Sur un succès, le compte connecté reprend les valeurs RELUES du serveur (store et session). Les refus :
 *   - 422 : sous SON champ (`name` → nom, `phone` → téléphone) ;
 *   - 403 `profile_managed_by_klassci` (et tout autre refus motivé) : le message du catalogue ;
 *   - sans réponse ou en 5xx : la modification est INCERTAINE, et c'est dit.
 */
export const CHAMPS_PROFIL = Object.freeze(['nom', 'telephone'])

const CHAMP_DU_SERVEUR = Object.freeze({ name: 'nom', phone: 'telephone' })

export function useMonProfil() {
  const auth = useAuthStore()
  const saisie = reactive({ nom: auth.user?.name ?? '', telephone: auth.user?.phone ?? '' })
  const erreurs = reactive({ nom: '', telephone: '' })
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        const champ = CHAMP_DU_SERVEUR[cle]
        if (champ) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return
    }
    const status = err?.response?.status
    erreur.value = status == null || status >= 500
      ? ERROR_MESSAGES.monProfilIncertain
      : err?.userMessage || ERROR_MESSAGES.unknown
  }

  async function enregistrer() {
    if (occupe.value) return false
    erreurs.nom = ''
    erreurs.telephone = ''
    erreur.value = ''
    annonce.value = ''
    const name = saisie.nom.trim()
    if (!name) {
      erreurs.nom = ERROR_MESSAGES.monProfilNomRequis
      return false
    }
    const phone = saisie.telephone.trim() || null
    occupe.value = true
    try {
      const response = await monCompteService.modifierProfil({ name, phone })
      auth.mettreAJourProfil({ name: response.data.name, phone: response.data.phone ?? null })
      saisie.nom = response.data.name
      saisie.telephone = response.data.phone ?? ''
      annonce.value = ERROR_MESSAGES.monProfilModifie
      return true
    } catch (err) {
      ranger(err)
      return false
    } finally {
      occupe.value = false
    }
  }

  return { saisie, erreurs, erreur, annonce, occupe, enregistrer }
}
