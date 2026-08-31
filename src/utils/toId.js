export function toId(value) {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'object') {
    return toId(
      value.id ??
      value.klassci_id ??
      value.teacher_id ??
      value.enseignant_id ??
      value.user_id ??
      value.professeur_id ??
      value.classe_id ??
      value.class_id ??
      value.matiere_id
    )
  }
  return String(value)
}
