import api from './api'
import { endpoints } from './endpoints'

export function previewImport(file) {
  const form = new FormData()
  form.append('file', file)
  return api.post(endpoints.lms.imports.preview, form, {
    transformRequest: [
      (data, headers) => {
        delete headers['Content-Type']
        return data
      },
    ],
  })
}
