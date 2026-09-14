import { getCurrentScope, onScopeDispose, ref } from 'vue'
import { cacheKey } from '@/services/cache'
import { confirmImport, getImport } from '@/services/importJob'
import { downloadBlob } from '@/utils/downloadBlob'
import { importReportCsv } from '@/utils/importReportCsv'

const STORAGE = 'import_job'
const PENDING = new Set(['queued', 'running'])
const POLL_MS = 2000

function unwrap(response) {
  return response?.data ?? response
}

function readStored() {
  try {
    const raw = localStorage.getItem(cacheKey(STORAGE))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const id = Number(parsed?.importId)
    return Number.isInteger(id) && id > 0 ? id : null
  } catch {
    return null
  }
}

function writeStored(id) {
  try {
    localStorage.setItem(cacheKey(STORAGE), JSON.stringify({ importId: id }))
  } catch {
    /* navigation privée / quota */
  }
}

function clearStored() {
  try {
    localStorage.removeItem(cacheKey(STORAGE))
  } catch {
    /* jsdom sans storage */
  }
}

/**
 * Job d'import (#334 écran 4) : persiste l'id, relit après reconnexion, poll
 * tant que le statut n'est pas terminal. Le rapport complet vit sur le serveur.
 */
export function useImportJob() {
  const importId = ref(null)
  const status = ref('')
  const report = ref(null)
  const polling = ref(false)
  const error = ref('')
  let intervalId = null

  function stop() {
    polling.value = false
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function apply(payload) {
    if (!payload?.status) return false
    importId.value = payload.import_id ?? importId.value
    status.value = payload.status
    report.value = payload
    if (!PENDING.has(payload.status)) stop()

    return true
  }

  async function refresh() {
    const id = importId.value
    if (!id) {
      stop()
      return false
    }
    try {
      const payload = unwrap(await getImport(id))
      error.value = ''
      return apply(payload)
    } catch (err) {
      if (err?.response?.status === 404) {
        clearStored()
        importId.value = null
        status.value = ''
        report.value = null
        stop()
        return false
      }
      error.value = err?.userMessage || err?.response?.data?.message || 'Lecture du rapport impossible.'
      stop()
      return false
    }
  }

  function start() {
    stop()
    if (!importId.value) return
    polling.value = true
    void refresh()
    intervalId = setInterval(() => { void refresh() }, POLL_MS)
  }

  async function confirm(id, preview = null) {
    const payload = unwrap(await confirmImport(id))
    const nextId = payload?.import_id ?? id
    writeStored(nextId)
    importId.value = nextId
    apply({
      import_id: nextId,
      status: payload?.status || 'queued',
      counts: preview?.counts ?? payload?.counts ?? null,
      rows: preview?.rows ?? payload?.rows ?? [],
    })
    start()
  }

  async function restore() {
    const id = readStored()
    if (!id) return false
    importId.value = id
    const ok = await refresh()
    if (ok && PENDING.has(status.value)) start()
    return ok
  }

  function exportCsv() {
    const rows = report.value?.rows
    if (!Array.isArray(rows) || rows.length === 0) return
    downloadBlob(
      new Blob([importReportCsv(rows)], { type: 'text/csv;charset=utf-8' }),
      'rapport-import-apprenants.csv',
    )
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return {
    importId,
    status,
    report,
    polling,
    error,
    confirm,
    restore,
    start,
    stop,
    exportCsv,
    clearStored,
  }
}
