/**
 * Parcours fonctionnel de la SÉANCE et de la VISIO (PR 4) : ce que chaque relecture exige pour dire VERT. L'entrée
 * de l'élève est jugée sur le JETON émis (un JWT dont la salle vaut celle de la séance), le DOMAINE Jitsi demandé
 * par le front, et la présence relue ; la vidéo est une limite déclarée (aucun serveur Jitsi en CI). La séance de
 * l'école KLASSCI a des heures RELATIVES au run, pour que la fenêtre de la visio soit ouverte à toute heure.
 */
import { describe, it, expect } from 'vitest'
import {
  ETAPES_SEANCE, DONNEES_SEANCE, AUCUN_CHEMIN_MODIFICATION_SEANCE, chargeDuJeton,
  jugerSeance, jugerVisio, jugerEntree, jugerModificationSeance, jugerSuppressionSeance,
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
  it('modifier : aucun bouton → ROUGE nommé, Refs lms_backend#1121', () => {
    expect(jugerModificationSeance(false).rouge).toBe(`${AUCUN_CHEMIN_MODIFICATION_SEANCE} : la carte n’offre aucun « Modifier » (Refs ouedraogoissouf2012/lms_backend#1121)`)
    expect(jugerModificationSeance(true)).toHaveProperty('nonTeste')
  })

  it('supprimer : 404 ET absente ; une confirmation « null » est citée (Refs #581)', () => {
    expect(jugerSuppressionSeance(lecture(404), lecture(200, [{ id: 8 }]), 7, 'la séance 12 ?').confirme).toBe(true)
    expect(jugerSuppressionSeance(lecture(404), lecture(200, []), 7, 'supprimer la séance null ?').preuve).toContain('Refs #581')
    expect(jugerSuppressionSeance(lecture(200, {}), lecture(200, []), 7, '').confirme).toBe(false)
    expect(jugerSuppressionSeance(lecture(404), lecture(200, [{ id: 7 }]), 7, '').confirme).toBe(false)
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
