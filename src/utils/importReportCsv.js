const STATUS_LABELS = { ok: 'Acceptée', error: 'Refusée' }

function cell(value) {
  const text = String(value ?? '')
  if (/[;"\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`

  return text
}

/**
 * Rapport d'import en CSV francophone (séparateur `;`) pour correction tableur.
 *
 * @param {Array<{line?: number, status?: string, message?: string|null}>} rows
 * @returns {string}
 */
export function importReportCsv(rows) {
  const lines = ['ligne;statut;motif']
  for (const row of rows ?? []) {
    const statut = STATUS_LABELS[row.status] ?? (row.status ?? '')
    lines.push([cell(row.line ?? ''), cell(statut), cell(row.message || '')].join(';'))
  }

  return `${lines.join('\n')}\n`
}

export { STATUS_LABELS as IMPORT_ROW_STATUS_LABELS }
