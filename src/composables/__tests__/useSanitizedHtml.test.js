import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSanitizedHtml } from '../useSanitizedHtml'

describe('useSanitizedHtml', () => {
  it('assainit une source ref', () => {
    const src = ref('<p>ok</p><script>alert(1)</script>')
    const safe = useSanitizedHtml(src)
    expect(safe.value).toContain('ok')
    expect(safe.value).not.toMatch(/<script/i)
  })

  it('réagit aux changements de la ref', () => {
    const src = ref('<b>a</b>')
    const safe = useSanitizedHtml(src)
    expect(safe.value).toContain('<b>a</b>')
    src.value = '<img src="x" onerror="alert(1)">'
    expect(safe.value).not.toMatch(/onerror/i)
  })

  it('accepte un getter', () => {
    const safe = useSanitizedHtml(() => '<a href="javascript:alert(1)">x</a>')
    expect(safe.value).not.toMatch(/javascript:/i)
    expect(safe.value).toContain('x')
  })

  it('accepte une chaîne simple', () => {
    expect(useSanitizedHtml('<em>hi</em>').value).toBe('<em>hi</em>')
  })

  it('fail-secure sur null/undefined', () => {
    expect(useSanitizedHtml(ref(null)).value).toBe('')
    expect(useSanitizedHtml(() => undefined).value).toBe('')
  })
})
