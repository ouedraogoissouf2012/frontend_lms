import { reactive } from 'vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

const vide = () => ({ ouvert: false, cle: null, jour: 1, nature: 'cours', debut: '', fin: '', matiere: '', enseignant: '', type: '', libelle: '' })

/**
 * La saisie d'UN créneau de la grille (#676) : l'ouvrir sur un jour, ou sur une ligne existante ; le vérifier ; le
 * rendre au format de l'écran. Un COURS exige une matière (l'enseignant vide veut dire « celui du programme ») ; une
 * PAUSE exige un nom ; la fin suit le début. Rien n'est envoyé ici : la grille part d'un bloc (useGrilleEmploiDuTemps).
 */
export function useCreneau() {
  const creneau = reactive(vide())
  const erreursCreneau = reactive({ matiere: '', libelle: '', horaire: '' })

  function effacerErreurs() {
    Object.assign(erreursCreneau, { matiere: '', libelle: '', horaire: '' })
  }

  function ouvrirSur(jour) {
    Object.assign(creneau, vide(), { ouvert: true, jour })
    effacerErreurs()
  }

  function ouvrirLigne(l) {
    Object.assign(creneau, vide(), {
      ouvert: true,
      cle: l.cle,
      jour: l.jour,
      nature: l.matiereId == null ? 'pause' : 'cours',
      debut: l.debut,
      fin: l.fin,
      matiere: l.matiereId == null ? '' : String(l.matiereId),
      enseignant: l.enseignantId == null ? '' : String(l.enseignantId),
      type: l.typeSeance ?? '',
      libelle: l.libelle ?? '',
    })
    effacerErreurs()
  }

  function fermer() {
    Object.assign(creneau, vide())
    effacerErreurs()
  }

  /** @returns {object|null} la ligne au format de l'écran, ou null si la saisie est refusée (erreurs dites). */
  function ligneSaisie() {
    effacerErreurs()
    const cours = creneau.nature === 'cours'
    if (cours && !toId(creneau.matiere)) erreursCreneau.matiere = ERROR_MESSAGES.emploiDuTempsMatiereRequise
    if (!cours && !creneau.libelle.trim()) erreursCreneau.libelle = ERROR_MESSAGES.emploiDuTempsLibelleRequis
    if (!creneau.debut || !creneau.fin) erreursCreneau.horaire = ERROR_MESSAGES.emploiDuTempsHoraireRequis
    else if (creneau.fin <= creneau.debut) erreursCreneau.horaire = ERROR_MESSAGES.emploiDuTempsFinAvantDebut
    if (erreursCreneau.matiere || erreursCreneau.libelle || erreursCreneau.horaire) return null
    return {
      cle: creneau.cle,
      jour: creneau.jour,
      debut: creneau.debut,
      fin: creneau.fin,
      matiereId: cours ? Number(toId(creneau.matiere)) : null,
      enseignantId: cours && toId(creneau.enseignant) ? Number(toId(creneau.enseignant)) : null,
      typeSeance: cours && creneau.type ? creneau.type : null,
      libelle: cours ? null : creneau.libelle.trim(),
    }
  }

  return { creneau, erreursCreneau, ouvrirSur, ouvrirLigne, fermer, ligneSaisie }
}
