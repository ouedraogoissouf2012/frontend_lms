import { describe, expect, it } from 'vitest'
import {
  analyser,
  comparerALaLigneDeBase,
  estFichierSuivi,
  extraireDefinitions,
  extraireLectures,
  serialiserLigneDeBase,
  verifierLigneDeBase,
} from '../../scripts/lib/proprietesNonDefinies.mjs'

const f = (fichier, source) => ({ fichier, source })

describe('garde des propriétés personnalisées définies nulle part (#442)', () => {
  it('suit les sources du front, pas la documentation', () => {
    expect(estFichierSuivi('src/App.vue')).toBe(true)
    expect(estFichierSuivi('src/assets/styles/themes.css')).toBe(true)
    expect(estFichierSuivi('src/main.js')).toBe(true)
    expect(estFichierSuivi('index.html')).toBe(true)
    expect(estFichierSuivi('README.md')).toBe(false)
  })

  it('compte les lectures, avec ou sans repli', () => {
    const lectures = extraireLectures('a { border: 1px solid var(--bord); color: var( --texte , #000); outline-color: var(--bord) }')

    expect(Object.fromEntries(lectures)).toEqual({ '--bord': 2, '--texte': 1 })
  })

  it('écarte un nom construit à l’exécution', () => {
    expect(extraireLectures('const c = `var(--brand-${n})`').size).toBe(0)
  })

  it('ne lit rien dans un commentaire', () => {
    expect(extraireLectures('/* var(--token, #hex) */ <!-- var(--autre) -->').size).toBe(0)
  })

  it('reconnaît les trois formes de définition', () => {
    const definitions = extraireDefinitions(
      ':root { --theme: #fff; }\n' +
        '<div :style="{ \'--lie\': couleur }">\n' +
        'el.style.setProperty("--dynamique", v)',
    )

    expect([...definitions].sort()).toEqual(['--dynamique', '--lie', '--theme'])
  })

  it('ne prend pas un modificateur BEM pour une définition', () => {
    const definitions = extraireDefinitions('.import-button--primary:hover { color: red }')

    expect(definitions.has('--primary')).toBe(false)
  })

  it('relève une propriété lue dans un fichier et définie dans aucun', () => {
    const { nonDefinies, lectures, definitions } = analyser([
      f('src/theme.css', ':root { --border-primary: #e2e8f0; }'),
      f('src/Carte.vue', '.carte { border-color: var(--border-color); outline: var(--border-primary) }'),
    ])

    expect(nonDefinies).toEqual({ '--border-color': 1 })
    expect(lectures).toBe(2)
    expect(definitions).toBe(1)
  })

  it('accepte une propriété définie dans un autre fichier', () => {
    const { nonDefinies } = analyser([
      f('src/a.css', ':root { --x: 1px; }'),
      f('src/b.vue', '.b { width: var(--x) }'),
    ])

    expect(nonDefinies).toEqual({})
  })

  it('fait échouer une propriété non définie neuve, et une propriété gelée qui gagne des lectures', () => {
    const resultat = comparerALaLigneDeBase(
      { '--neuve': 1, '--gelee': 4, '--stable': 2 },
      { '--gelee': 3, '--stable': 2 },
    )

    expect(resultat.nouvelles).toEqual([{ nom: '--neuve', lectures: 1 }])
    expect(resultat.accrues).toEqual([{ nom: '--gelee', lectures: 4, permis: 3, hausse: 1 }])
  })

  it('accepte qu’une propriété gelée perde des lectures ou disparaisse', () => {
    expect(comparerALaLigneDeBase({ '--gelee': 1 }, { '--gelee': 3, '--partie': 5 }))
      .toEqual({ nouvelles: [], accrues: [] })
  })

  it('refuse une ligne de base mal formée', () => {
    expect(() => verifierLigneDeBase([])).toThrow(/attendu un objet/)
    expect(() => verifierLigneDeBase({ 'pas-un-nom': 1 })).toThrow(/n'est pas un nom/)
    expect(() => verifierLigneDeBase({ '--x': 0 })).toThrow(/non valide/)
    expect(() => verifierLigneDeBase({ '--x': 2 })).not.toThrow()
  })

  it('sérialise la ligne de base triée, pour un diff stable', () => {
    expect(serialiserLigneDeBase({ '--b': 1, '--a': 2 })).toBe('{\n  "--a": 2,\n  "--b": 1\n}\n')
  })
})
