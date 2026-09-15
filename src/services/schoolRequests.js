import api from './api'
import { endpoints } from './endpoints'

export const schoolRequestsService = {
  list(page = 1) {
    return api.get(endpoints.admin.schoolRequests.list, { params: { page, per_page: 25 } })
  },

  validate(id, slug) {
    const body = slug ? { slug } : {}
    return api.post(endpoints.admin.schoolRequests.validate(id), body)
  },

  refuse(id, motif_refus) {
    return api.post(endpoints.admin.schoolRequests.refuse(id), { motif_refus })
  },
}
