/**
 * La garde « clé inexistante » doit ROUGIR — c'est ce que ce fichier prouve.
 *
 * Le dépôt a déjà payé la garde qui ne peut pas échouer : deux gardes de taille
 * du backend affichaient « ✓ … respectent la limite » **sans avoir inspecté un
 * seul fichier** (#701), et un test entérinait ce comportement.
 *
 * On écrit donc d'abord les cas qui prouvent qu'elle attrape, puis — tout aussi
 * importants — ceux qui prouvent qu'elle **se tait** là où elle le doit. Une
 * garde bruyante est une garde désactivée dans la semaine : les faux positifs
 * sont testés avec autant de soin que les vrais.
 */
import { describe, it, expect } from 'vitest'
import {
  clesAutorisees,
  construireBaseline,
  estNormaliseur,
  inspecter,
  nouvelles,
  total,
} from '../../scripts/lib/clesInexistantes.mjs'

/** Destinataire « user », tel que le runner le construit. */
const RECEVEUR_USER = {
  nom: 'user (POST /auth/login)',
  motif: /(?<![.\w])(?:user|currentUser)(?:\.value)?\??\.([A-Za-z_][A-Za-z0-9_]*)/g,
  portee: /auth\.getUser\(\)|useAuthStore\(\)[\s\S]{0,40}currentUser|\bcurrentUser\b\s*=/,
  horsPortee: null,
  autorisees: new Set(['id', 'klassci_id', 'name', 'email', 'role']),
}

const DANS_PORTEE = "const u = auth.getUser()\n"

describe('garde clés inexistantes — elle rougit', () => {
  it('attrape une clé absente de la charge', () => {
    const src = DANS_PORTEE + "const n = user.nom || ''"

    const v = inspecter('src/composables/useX.js', src, [RECEVEUR_USER])

    expect(v).toHaveLength(1)
    expect(v[0].cle).toBe('nom')
    expect(v[0].line).toBe(2)
  })

  it('attrape PLUSIEURS clés sur une même ligne', () => {
    // Le `lastIndex` d'un motif /g est partagé entre appels : sans remise à
    // zéro, la seconde clé de la ligne serait silencieusement sautée.
    const src = DANS_PORTEE + '{{ user.nom }} {{ user.prenom }}'

    const v = inspecter('src/components/X.vue', src, [RECEVEUR_USER])

    expect(v.map((x) => x.cle)).toEqual(['nom', 'prenom'])
  })

  it('signale la ligne et un extrait, pour qu’on sache quoi corriger', () => {
    const v = inspecter('src/X.vue', DANS_PORTEE + 'const c = user.created_at', [RECEVEUR_USER])

    expect(v[0].line).toBeGreaterThan(0)
    expect(v[0].extrait).toContain('created_at')
    expect(v[0].receveur).toBe('user (POST /auth/login)')
  })
})

describe('garde clés inexistantes — elle se tait là où elle le doit', () => {
  it('ne dit rien d’une clé qui existe VRAIMENT', () => {
    const src = DANS_PORTEE + 'const n = user.name'

    expect(inspecter('src/X.vue', src, [RECEVEUR_USER])).toEqual([])
  })

  it('ne dit rien hors de la portée du destinataire', () => {
    // Ce fichier ne touche jamais l'authentification : son `user` est un autre
    // objet — l'auteur d'un message, une ligne de la table des comptes…
    const src = "const u = props.rows[0]\nconst m = user.matricule"

    expect(inspecter('src/X.vue', src, [RECEVEUR_USER])).toEqual([])
  })

  it('ne confond pas un accès en cascade avec l’utilisateur connecté', () => {
    // `post.user.matricule` n'est pas l'utilisateur connecté.
    const src = DANS_PORTEE + 'const m = post.user.matricule'

    expect(inspecter('src/X.vue', src, [RECEVEUR_USER])).toEqual([])
  })

  it('ne dit rien d’un chemin explicitement hors portée', () => {
    const receveur = { ...RECEVEUR_USER, horsPortee: /^src\/components\/student\// }
    const src = DANS_PORTEE + 'const n = user.nom'

    expect(inspecter('src/components/student/X.vue', src, [receveur])).toEqual([])
    // …mais ailleurs, elle attrape toujours.
    expect(inspecter('src/components/teacher/X.vue', src, [receveur])).toHaveLength(1)
  })

  it('ne confond pas un COMMENTAIRE avec une lecture', () => {
    const src = DANS_PORTEE + '// user.nom rendait une chaine vide, voir #372'

    expect(inspecter('src/X.vue', src, [RECEVEUR_USER])).toEqual([])
  })

  it('ne signale pas les méthodes JavaScript courantes', () => {
    const src = DANS_PORTEE + 'const s = user.name.trim().toUpperCase()'

    expect(inspecter('src/X.vue', src, [RECEVEUR_USER])).toEqual([])
  })

  it('laisse les NORMALISEURS lire les deux formes — c’est leur rôle', () => {
    const src = DANS_PORTEE + 'const n = user.nom || user.prenom'

    expect(estNormaliseur('src/utils/formatters.js')).toBe(true)
    expect(inspecter('src/utils/formatters.js', src, [RECEVEUR_USER])).toEqual([])
  })
})

describe('les clés ajoutées par un normaliseur ne peuvent pas dériver', () => {
  it('la liste déclarée est IDENTIQUE à ce que deriveTeacherCounters produit', async () => {
    // La garde tourne sous Node, qui ne résout pas les imports sans extension
    // de `src/utils/` : elle ne peut donc pas importer le normaliseur et doit
    // déclarer ses clés. Ce test — lui, exécuté par Vitest, qui résout l'alias —
    // est ce qui empêche la liste déclarée de dériver en silence.
    const { deriveTeacherCounters } = await import('@/utils/teacherDashboard')
    const { RECEVEURS } = await import('../../scripts/lib/clesInexistantes.mjs')

    const receveur = RECEVEURS.find((r) => r.nom.includes('teacher-dashboard'))
    const produites = Object.keys(deriveTeacherCounters(null, null)).sort()

    expect([...(receveur.clesAjoutees ?? [])].sort()).toEqual(produites)
  })

  it('elles entrent dans les clés autorisées', () => {
    const cles = clesAutorisees(
      { A: { statistiques: { heures: {}, evaluations: {} } } },
      { exports: ['A'], chemin: 'statistiques', clesAjoutees: ['total_lecons'] },
    )

    expect([...cles].sort()).toEqual(['evaluations', 'heures', 'total_lecons'])
  })
})

describe('la vérité vient de la fixture, pas du script', () => {
  it('dérive les clés autorisées du module importé', () => {
    const faux = {
      A: { id: 1, name: 'x' },
      B: { id: 1, email: 'y' },
    }

    const cles = clesAutorisees(faux, { exports: ['A', 'B'], chemin: null })

    expect([...cles].sort()).toEqual(['email', 'id', 'name'])
  })

  it('sait descendre dans un sous-objet', () => {
    const faux = { A: { statistiques: { heures: {}, evaluations: {} } } }

    const cles = clesAutorisees(faux, { exports: ['A'], chemin: 'statistiques' })

    expect([...cles].sort()).toEqual(['evaluations', 'heures'])
  })
})

describe('le cliquet ne peut que se resserrer', () => {
  const v = inspecter('src/X.vue', DANS_PORTEE + 'const a = user.nom', [RECEVEUR_USER])

  it('la dette gelée n’est pas signalée', () => {
    const b = construireBaseline(v)

    expect(nouvelles(v, b)).toEqual([])
    expect(total(b)).toBe(v.length)
  })

  it('une lecture SUPPLÉMENTAIRE dans un fichier déjà gelé rougit', () => {
    const b = construireBaseline(v)

    expect(nouvelles([...v, { ...v[0], line: 99 }], b)).toHaveLength(1)
  })

  it('un fichier NEUF rougit entièrement', () => {
    const b = construireBaseline(v)
    const ailleurs = inspecter('src/Y.vue', DANS_PORTEE + 'const a = user.nom', [RECEVEUR_USER])

    expect(nouvelles(ailleurs, b)).toHaveLength(1)
  })

  it('DÉPLACER une lecture existante ne rougit pas', () => {
    // Le cliquet gèle un compte, pas des numéros de ligne : un reformatage ne
    // doit pas faire échouer la CI.
    const b = construireBaseline(v)

    expect(nouvelles(v.map((x) => ({ ...x, line: x.line + 40 })), b)).toEqual([])
  })
})
