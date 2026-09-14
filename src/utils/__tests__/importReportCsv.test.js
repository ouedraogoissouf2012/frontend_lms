import { describe, expect, it } from 'vitest'
import { importReportCsv } from '@/utils/importReportCsv'

describe('importReportCsv (#334)', () => {
  it('exporte un csv francophone actionnable', () => {
    const csv = importReportCsv([
      { line: 2, status: 'ok', message: null },
      { line: 3, status: 'error', message: 'téléphone déjà utilisé par Awa Traoré' },
    ])

    expect(csv).toBe(
      'ligne;statut;motif\n'
      + '2;Acceptée;\n'
      + '3;Refusée;téléphone déjà utilisé par Awa Traoré\n',
    )
  })

  it('protege les motifs qui contiennent un point-virgule', () => {
    const csv = importReportCsv([
      { line: 4, status: 'error', message: 'valeur; interdite' },
    ])

    expect(csv).toContain('"valeur; interdite"')
  })
})
