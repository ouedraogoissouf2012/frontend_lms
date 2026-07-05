import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../sanitizeHtml'

/**
 * Edge cases XSS stocké pour le contenu enrichi rendu via v-html.
 * On vérifie que les vecteurs sont neutralisés ET que le formatage légitime
 * (produit par TipTap) survit.
 */
describe('sanitizeHtml — vecteurs XSS neutralisés', () => {
  it('supprime les balises <script>', () => {
    const out = sanitizeHtml('<p>ok</p><script>alert(1)</script>')
    expect(out).not.toMatch(/<script/i)
    expect(out).toContain('ok')
  })

  it('supprime les gestionnaires on* (onerror, onclick, onload)', () => {
    const out = sanitizeHtml('<img src="x" onerror="alert(1)"><div onclick="alert(2)">a</div>')
    expect(out).not.toMatch(/onerror/i)
    expect(out).not.toMatch(/onclick/i)
    expect(out).not.toMatch(/alert/)
  })

  it('neutralise href="javascript:"', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">clic</a>')
    expect(out).not.toMatch(/javascript:/i)
    expect(out).toContain('clic')
  })

  it('neutralise une source data: (exfiltration/HTML embarqué)', () => {
    const out = sanitizeHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">')
    expect(out).not.toMatch(/data:/i)
  })

  it('supprime <iframe>, <object>, <embed>, <form>, <input>', () => {
    const out = sanitizeHtml(
      '<iframe src="https://evil"></iframe><object></object><embed><form><input></form>',
    )
    expect(out).not.toMatch(/<iframe/i)
    expect(out).not.toMatch(/<object/i)
    expect(out).not.toMatch(/<embed/i)
    expect(out).not.toMatch(/<form/i)
    expect(out).not.toMatch(/<input/i)
  })

  it('supprime <style> (exfiltration CSS / clobbering)', () => {
    const out = sanitizeHtml('<style>body{background:url(javascript:alert(1))}</style><p>x</p>')
    expect(out).not.toMatch(/<style/i)
    expect(out).toContain('x')
  })

  it('neutralise les URLs dangereuses dans les styles inline', () => {
    const out = sanitizeHtml('<p style="background:url(javascript:alert(1));color:red">x</p>')
    expect(out).not.toMatch(/javascript:/i)
    expect(out).not.toMatch(/alert/)
    expect(out).toContain('color:red')
  })

  it('résiste au mutation-XSS via SVG', () => {
    const out = sanitizeHtml('<svg><script>alert(1)</script></svg>')
    expect(out).not.toMatch(/<script/i)
    expect(out).not.toMatch(/alert/)
  })

  it('résiste au vecteur <a><math><mtext>… (mXSS connu)', () => {
    const out = sanitizeHtml('<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>')
    expect(out).not.toMatch(/onerror/i)
    expect(out).not.toMatch(/alert/)
  })
})

describe('sanitizeHtml — durcissement des liens', () => {
  it('force rel="noopener noreferrer" sur les liens target=_blank', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>')
    expect(out).toMatch(/rel="noopener noreferrer"/)
  })

  it('remplace un rel malveillant (opener) sur target=_blank', () => {
    const out = sanitizeHtml('<a href="https://example.com" target="_blank" rel="opener">x</a>')
    expect(out).not.toMatch(/rel="opener"/)
    expect(out).toMatch(/noopener/)
  })
})

describe('sanitizeHtml — formatage légitime préservé', () => {
  it('conserve le formatage inline et les titres', () => {
    const html = '<h2>Titre</h2><p><strong>gras</strong> <em>ital</em> <u>soul</u></p>'
    expect(sanitizeHtml(html)).toBe(html)
  })

  it('conserve listes, tableaux, code et liens http(s)', () => {
    const out = sanitizeHtml(
      '<ul><li>a</li></ul><table><tr><td>c</td></tr></table>' +
        '<pre><code>x=1</code></pre><a href="https://ok.io">lien</a>',
    )
    expect(out).toContain('<li>a</li>')
    expect(out).toContain('<td>c</td>')
    expect(out).toContain('<code>x=1</code>')
    expect(out).toContain('href="https://ok.io"')
  })

  it('conserve une image http(s) légitime sans handler', () => {
    const out = sanitizeHtml('<img src="https://cdn.io/a.png" alt="a">')
    expect(out).toContain('src="https://cdn.io/a.png"')
    expect(out).toContain('alt="a"')
  })
})

describe('sanitizeHtml — fail-secure', () => {
  it('renvoie une chaîne vide pour entrée non-string ou vide', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
    expect(sanitizeHtml(123)).toBe('')
    expect(sanitizeHtml({})).toBe('')
    expect(sanitizeHtml('')).toBe('')
  })
})
