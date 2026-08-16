import { describe, expect, it } from 'vitest'
import { buildSrcdoc, escapeScriptTags, apiMessage } from './bootstrap.ts'
import { BRIDGE_TYPES } from './constants.ts'

describe('escapeScriptTags (04-01-FINDINGS #3)', () => {
  it('neutralizes every literal </script so user code cannot break the bootstrap', () => {
    const hostile = '</script><script>alert(1)</script>'
    const escaped = escapeScriptTags(hostile)
    expect(escaped).not.toContain('</script>')
    expect(escaped).not.toContain('</script')
    expect(escaped).toContain('<\\/script>')
  })

  it('neutralizes HTML-comment openers', () => {
    expect(escapeScriptTags('<!-- x -->')).not.toContain('<!--')
  })
})

describe('buildSrcdoc', () => {
  it('injects the nonce into the bootstrap script', () => {
    const doc = buildSrcdoc({ html: '<p>hi</p>', css: 'p{color:red}', js: 'console.log(1)' }, 'deadbeef')
    expect(doc).toContain("'deadbeef'")
    expect(doc).toContain(BRIDGE_TYPES.READY)
  })

  it('embeds user html/css/js with dangerous closers neutralized', () => {
    const code = {
      html: '</script><p>break</p>',
      css: 'body{background:red}</script>',
      js: 'alert("</script>")',
    }
    const doc = buildSrcdoc(code, 'nonce123')
    // User content is embedded…
    expect(doc).toContain('<p>break</p>')
    expect(doc).toContain('body{background:red}')
    expect(doc).toContain('alert("')
    // …with every dangerous closer neutralized (\\/ in JS strings === /, so semantics are preserved).
    expect(doc).toContain('<\\/script><p>break</p>')
    expect(doc).toContain('body{background:red}<\\/script>')
    expect(doc).toContain('alert("<\\/script>")')
    // Ordinary HTML closers pass through untouched.
    expect(doc).toContain('</p>')
    // The user's raw sequences never survive verbatim.
    expect(doc).not.toContain('</script><p>')
    expect(doc).not.toContain('alert("</script>')
  })

  it('exposes window.deskmate and posts the ready handshake', () => {
    const doc = buildSrcdoc({ html: '', css: '', js: '' }, 'nonce123')
    expect(doc).toContain('window.deskmate')
    expect(doc).toContain('window.parent.postMessage')
    expect(doc).toContain('__DESKMATE_NONCE__')
  })

  it('apiMessage embeds type + nonce + payload', () => {
    const msg = apiMessage('abc', { theme: { accent: '#fff' }, size: { w: 10, h: 20 }, config: null })
    const parsed = JSON.parse(msg)
    expect(parsed).toMatchObject({ type: BRIDGE_TYPES.API, nonce: 'abc', theme: { accent: '#fff' }, size: { w: 10, h: 20 } })
  })
})
