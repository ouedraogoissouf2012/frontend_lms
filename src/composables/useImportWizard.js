import { computed, ref } from 'vue'
import { IMPORT_FIELDS } from '../constants/importFields'
import { previewImport } from '../services/importPreview'

function detectDelimiter(line) {
  const scores = { ';': 0, ',': 0, '\t': 0 }
  for (const char of line) {
    if (char in scores) scores[char] += 1
  }
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]
}

export function useImportWizard() {
  const step = ref(1)
  const file = ref(null)
  const headers = ref([])
  const delimiter = ref(';')
  const mapping = ref({})
  const report = ref(null)
  const loading = ref(false)
  const error = ref('')

  const mappingComplete = computed(() =>
    IMPORT_FIELDS.filter((field) => field.required).every((field) => mapping.value[field.key]),
  )

  function chooseFile(next) {
    file.value = next
    error.value = ''
    report.value = null
  }

  async function readHeaders() {
    if (!file.value) return
    const text = await file.value.text()
    const first = text.split(/\r?\n/, 1)[0] ?? ''
    delimiter.value = detectDelimiter(first)
    headers.value = first.split(delimiter.value).map((header) => header.trim()).filter(Boolean)
    const next = {}
    for (const field of IMPORT_FIELDS) {
      const exact = headers.value.find((header) => header.toLowerCase() === field.key)
      if (exact) next[field.key] = exact
    }
    mapping.value = next
    step.value = 2
  }

  async function remapFile() {
    const current = file.value
    if (!current) return null
    const text = await current.text()
    const lines = text.split(/\r?\n/)
    const sourceHeaders = headers.value
    const indexByHeader = Object.fromEntries(sourceHeaders.map((header, index) => [header, index]))
    const body = lines.slice(1).filter((line) => line.trim() !== '')
    const rebuilt = body.map((line) => {
      const cols = line.split(delimiter.value)
      return IMPORT_FIELDS.map((field) => cols[indexByHeader[mapping.value[field.key]]] ?? '').join(';')
    })
    const canonical = IMPORT_FIELDS.map((field) => field.key).join(';')
    return new File([`${canonical}\n${rebuilt.join('\n')}`], current.name, { type: 'text/csv' })
  }

  async function runPreview() {
    loading.value = true
    error.value = ''
    try {
      const payload = await remapFile()
      if (!payload) return
      const response = await previewImport(payload)
      report.value = response.data ?? response
      step.value = 3
    } catch (err) {
      error.value = err.userMessage || err.response?.data?.message || 'Analyse impossible.'
    } finally {
      loading.value = false
    }
  }

  return {
    step,
    file,
    headers,
    mapping,
    report,
    loading,
    error,
    mappingComplete,
    chooseFile,
    readHeaders,
    runPreview,
  }
}
