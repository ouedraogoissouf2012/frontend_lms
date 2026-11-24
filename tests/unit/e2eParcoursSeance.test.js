/**
 * Parcours fonctionnel de la SÉANCE et de la VISIO (PR 4) : ce que chaque relecture exige pour dire VERT. L'entrée
 * de l'élève est jugée sur le JETON émis (un JWT dont la salle vaut celle de la séance), le DOMAINE Jitsi demandé
 * par le front, et la présence relue ; la vidéo est une limite déclarée (aucun serveur Jitsi en CI). La séance de
 * l'école KLASSCI a des heures RELATIVES au run, pour que la fenêtre de la visio soit ouverte à toute heure.
 */
import { describe, it, expect } from 'vitest'
import {
  ETAPES_SEANCE, DONNEES_SEANCE, TITRE_MODIFIE, chargeDuJeton,
  jugerSeance, jugerVisio, jugerEntree, jugerBoutonModifier, jugerSuppressionSeance,
  ligneHistorique, jugerPorte, jugerSuppressionMiroir,
} from '../../e2e/parcours-seance.mjs'
import { heuresDuRun } from '../../e2e/klassci-ecole/jeu.mjs'

const lecture = (statut, data) => ({ statut, corps: data === undefined ? null : { success: statut < 400, data } })
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const jwt = (charge) => `${b64({ alg: 'HS256' })}.${b64(charge)}.signature`
const ENTREE = { join: { visio_token: jwt({ room: 'salle-1' }), visio_room_id: 'salle-1' }, versJitsi: ['https://visio.example.test/external_api.js'] }
// La forme réelle : `attendances` à la RACINE du corps, pas sous `data` (E2E 43795413708).
const presences = (lignes) => ({ statut: 200, corps: { success: true, statistics: {}, attendances: lignes } })
const PRESENCES = presences([{ email: 'eleve@x' }])

describe('parcours-seance — les étapes', () => {
  it('séance → activer → démarrer → l’élève rejoint → terminer ; modifier et supprimer la séance', () => {
    expect(ETAPES_SEANCE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['seance', 'enseignant', []],
      ['activer', 'enseignant', ['seance']],
      ['demarrer', 'enseignant', ['activer']],
      ['rejoindre', 'etudiant', ['demarrer']],
      ['terminer', 'enseignant', ['demarrer']],
      ['modifier', 'enseignant', ['seance']],
      ['supprimer', 'enseignant', ['seance']],
    ])
  })

  it('aucune étape ne requiert « modifier » ni « rejoindre » : leurs ROUGE n’arrêtent pas la fin de la visio', () => {
    expect(ETAPES_SEANCE.some((e) => e.requiert.some((r) => ['modifier', 'rejoindre'].includes(r)))).toBe(false)
  })

  it('le titre fictif ne porte aucun mot d’énumération', () => {
    expect(DONNEES_SEANCE.titre).not.toMatch(/\b(active|programmee|terminee|published|draft)\b/i)
  })
})

describe('parcours-seance — la séance et sa visio relues', () => {
  it('la séance : son titre (école LMS) et son heure de début', () => {
    expect(jugerSeance(lecture(200, { seance: { titre: 'T', programmation: { heure_debut: '10:00' } } }), 7, 'T')).toMatchObject({ confirme: true, heure: '10:00' })
    expect(jugerSeance(lecture(200, { seance: { titre: 'Autre' } }), 7, 'T').confirme).toBe(false)
  })

  it('la visio : activée, au statut attendu, avec sa salle', () => {
    expect(jugerVisio(lecture(200, { visio: { enabled: true, status: 'active', room_id: 'salle-1' } }), 7, 'active')).toMatchObject({ confirme: true, salle: 'salle-1' })
    expect(jugerVisio(lecture(200, { visio: { enabled: true, status: 'programmee', room_id: 'salle-1' } }), 7, 'active').confirme).toBe(false)
    expect(jugerVisio(lecture(200, { visio: { enabled: false } }), 7, 'programmee').confirme).toBe(false)
  })
})

describe('parcours-seance — l’entrée de l’élève (jeton, salle, domaine, présence)', () => {
  it('VERT : un JWT pour LA salle, la salle demandée au domaine Jitsi, la présence relue', () => {
    expect(jugerEntree(ENTREE, 'salle-1', PRESENCES, 'eleve@x').confirme).toBe(true)
  })

  it('ROUGE : aucun jeton (pas de secret côté serveur)', () => {
    expect(jugerEntree({ ...ENTREE, join: { visio_token: null, visio_room_id: 'salle-1' } }, 'salle-1', PRESENCES, 'eleve@x').ecart).toContain('aucun jeton')
  })

  it('ROUGE : un jeton pour une autre salle', () => {
    expect(jugerEntree({ ...ENTREE, join: { visio_token: jwt({ room: 'autre' }), visio_room_id: 'salle-1' } }, 'salle-1', PRESENCES, 'eleve@x').confirme).toBe(false)
  })

  it('ROUGE : le front n’a rien demandé au domaine Jitsi, ou la présence manque', () => {
    expect(jugerEntree({ ...ENTREE, versJitsi: [] }, 'salle-1', PRESENCES, 'eleve@x').confirme).toBe(false)
    expect(jugerEntree(ENTREE, 'salle-1', presences([]), 'eleve@x').confirme).toBe(false)
    // Une liste sous `data` n'est pas la forme du serveur : elle n'est pas lue.
    expect(jugerEntree(ENTREE, 'salle-1', lecture(200, { attendances: [{ email: 'eleve@x' }] }), 'eleve@x').confirme).toBe(false)
  })

  it('un jeton illisible n’est pas un jeton', () => {
    expect(chargeDuJeton('pas-un-jwt')).toBeNull()
    expect(chargeDuJeton(null)).toBeNull()
  })
})

describe('parcours-seance — modifier et supprimer', () => {
  // lms_backend#1121 (décision du user) : l'école autonome modifie ; l'école KLASSCI, jamais (aucun bouton).
  it('modifier, école LMS : le bouton → on joue la modification ; aucun bouton → ROUGE nommé', () => {
    expect(jugerBoutonModifier(true, false)).toBeNull()
    expect(jugerBoutonModifier(false, false).rouge).toBe('la carte d’une séance locale n’offre aucun « Modifier » (can_be_edited, Refs ouedraogoissouf2012/lms_backend#1121)')
  })

  it('modifier, école KLASSCI : sans objet, après avoir VÉRIFIÉ qu’aucun bouton ne paraît ; un bouton → ROUGE', () => {
    expect(jugerBoutonModifier(false, true).nonTeste).toBe('sans objet : une séance KLASSCI se modifie dans KLASSCI ; sa carte n’offre aucun « Modifier » (vérifié)')
    expect(jugerBoutonModifier(true, true).rouge).toBe('une séance KLASSCI offre « Modifier » : elle se modifie dans KLASSCI (Refs ouedraogoissouf2012/lms_backend#1121)')
  })

  it('modifier : le titre modifié GARDE le titre d’origine, que l’étape « supprimer » cherche ensuite', () => {
    expect(TITRE_MODIFIE).not.toBe(DONNEES_SEANCE.titre)
    expect(TITRE_MODIFIE).toContain(DONNEES_SEANCE.titre)
  })

  it('modifier : la relecture exige le titre modifié', () => {
    const relue = (titre) => lecture(200, { seance: { titre, programmation: { heure_debut: '2026-11-20T08:30:00+00:00' } } })
    expect(jugerSeance(relue(TITRE_MODIFIE), 7, TITRE_MODIFIE).confirme).toBe(true)
    expect(jugerSeance(relue(DONNEES_SEANCE.titre), 7, TITRE_MODIFIE).confirme).toBe(false)
  })

  it('supprimer : 404 ET absente ; une confirmation « null » est citée (Refs #581)', () => {
    expect(jugerSuppressionSeance(lecture(404), lecture(200, [{ id: 8 }]), 7, 'la séance 12 ?').confirme).toBe(true)
    expect(jugerSuppressionSeance(lecture(404), lecture(200, []), 7, 'supprimer la séance null ?').preuve).toContain('Refs #581')
    expect(jugerSuppressionSeance(lecture(200, {}), lecture(200, []), 7, '').confirme).toBe(false)
    expect(jugerSuppressionSeance(lecture(404), lecture(200, [{ id: 7 }]), 7, '').confirme).toBe(false)
  })
})

describe('parcours-seance — la suppression passe par la porte LOCALE (#623, lms_backend#1154)', () => {
  it('école LMS : la ligne est la séance créée, son id est local', () => {
    expect(ligneHistorique(null, 'lms', 7, 'Seance parcours')).toEqual({ id: 7, titre: 'Seance parcours' })
  })

  it('école KLASSCI : la ligne est le MIROIR local de la séance KLASSCI, relu par son klassci_seance_id', () => {
    const histo = lecture(200, [{ id: 3, klassci_seance_id: null, titre: 'autre' }, { id: 42, klassci_seance_id: 9701, titre: 'Séance #9701' }])
    expect(ligneHistorique(histo, 'klassci', 9701, 'ignoré')).toEqual({ id: 42, titre: 'Séance #9701' })
  })

  it('école KLASSCI : aucun miroir, ou deux, ou l’historique illisible : ROUGE nommé, jamais un id deviné', () => {
    expect(ligneHistorique(lecture(200, []), 'klassci', 9701).rouge).toBe('0 miroir(s) local(aux) de la séance KLASSCI 9701 dans l’historique, 1 attendu')
    const deux = lecture(200, [{ id: 1, klassci_seance_id: 9701 }, { id: 2, klassci_seance_id: '9701' }])
    expect(ligneHistorique(deux, 'klassci', 9701).rouge).toMatch(/^2 miroir/)
    expect(ligneHistorique(lecture(500), 'klassci', 9701).rouge).toBe('GET /lms/seances/history rend HTTP 500')
  })

  it('la porte : DELETE /lms/seances/local/{id local} ; la porte historique, ou aucune requête, ROUGE', () => {
    expect(jugerPorte('/api/lms/seances/local/42', 42)).toBeNull()
    expect(jugerPorte('/api/lms/seances/42', 42).rouge).toBe('la suppression passe par /api/lms/seances/42, /api/lms/seances/local/42 attendu (porte locale, #623)')
    expect(jugerPorte('/api/lms/seances/local/9701', 42).rouge).toMatch(/local\/42 attendu/)
    expect(jugerPorte(null, 42).rouge).toMatch(/^la suppression passe par aucune requête/)
  })

  it('le miroir supprimé : absent de l’historique, la séance KLASSCI toujours au calendrier', () => {
    const preuve = jugerSuppressionMiroir(lecture(200, [{ id: 3 }]), lecture(200, [{ id: 9701 }]), 42, 9701)
    expect(preuve).toEqual({ confirme: true, preuve: 'miroir local 42 supprimé par la porte locale, absent de l’historique ; séance KLASSCI 9701 toujours au calendrier' })
    expect(jugerSuppressionMiroir(lecture(200, [{ id: 42 }]), lecture(200, [{ id: 9701 }]), 42, 9701).ecart).toBe('le miroir local 42 est encore dans l’historique')
    expect(jugerSuppressionMiroir(lecture(200, []), lecture(200, []), 42, 9701).ecart).toBe('la séance KLASSCI 9701 a quitté le calendrier : seul son miroir local devait partir')
    expect(jugerSuppressionMiroir(lecture(200, []), lecture(403), 42, 9701).ecart).toBe('GET /lms/seances/my-teaching rend HTTP 403')
  })
})

describe('faux KLASSCI — les heures de la séance 9701, relatives au run (D2)', () => {
  it('début il y a 10 min, fin dans 1 h 50 (UTC, « HH:mm »)', () => {
    expect(heuresDuRun(new Date('2026-11-16T03:00:00Z'))).toEqual({ heure_debut: '02:50', heure_fin: '04:50' })
  })

  it('bornées au jour même : la date de la séance reste aujourd’hui', () => {
    expect(heuresDuRun(new Date('2026-11-16T00:05:00Z'))).toEqual({ heure_debut: '00:00', heure_fin: '01:55' })
    expect(heuresDuRun(new Date('2026-11-16T23:00:00Z'))).toEqual({ heure_debut: '22:50', heure_fin: '23:59' })
  })
})
