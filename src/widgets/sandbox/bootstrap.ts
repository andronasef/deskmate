import { BRIDGE_TYPES } from './constants.ts'

export interface WidgetCode {
  html: string
  css: string
  js: string
}

/**
 * The exact escaping rule from 04-01-FINDINGS #3: only the dangerous closers are
 * neutralized — a literal `</script` (or `</style` in CSS) inside an embedded string
 * would terminate the bootstrap. Ordinary HTML closers like `</p>` pass through.
 * Also neutralize `<!--` (HTML-comment closers can swallow following markup).
 * Note: in JS string literals `\/` === `/`, so escaping is semantically neutral.
 */
export function escapeScriptTags(input: string): string {
  return input.replace(/<\/script/gi, '<\\/script').replace(/<\/style/gi, '<\\/style').replace(/<!--/g, '\\u003C!--')
}

export const API_SHIM_JS = `
;(function () {
  var listeners = [];
  var api = { theme: {}, size: { w: 0, h: 0 }, config: null, onUpdate: function (fn) { listeners.push(fn); } };
  window.deskmate = api;
  window.addEventListener('message', function (event) {
    var data;
    try { data = JSON.parse(event.data); } catch (e) { return; }
    if (data && data.type === '${BRIDGE_TYPES.API}') {
      if (data.theme) api.theme = data.theme;
      if (data.size) api.size = data.size;
      if (data.config !== undefined) api.config = data.config;
      for (var i = 0; i < listeners.length; i++) { try { listeners[i](api); } catch (e) {} }
    }
  });
  window.parent.postMessage(JSON.stringify({ type: '${BRIDGE_TYPES.READY}', nonce: __DESKMATE_NONCE__ }), '*');
})();
`

export interface DeskMateApiPayload {
  theme: { accent: string }
  size: { w: number; h: number }
  config: unknown
}

/**
 * Build the srcdoc document: escaped bootstrap injecting the nonce + API shim,
 * user CSS in <style>, user HTML in <body>, user JS in a final <script>.
 */
export function buildSrcdoc(code: WidgetCode, nonce: string): string {
  const css = escapeScriptTags(code.css ?? '')
  const html = escapeScriptTags(code.html ?? '')
  const js = escapeScriptTags(code.js ?? '')
  return [
    '<!doctype html><html><head><meta charset="utf-8"><style>',
    css,
    '</style></head><body>',
    html,
    `<script>var __DESKMATE_NONCE__ = '${nonce}';${API_SHIM_JS}</script>`,
    '<script>',
    js,
    '</script></body></html>',
  ].join('')
}

export function apiMessage(nonce: string, api: DeskMateApiPayload): string {
  return JSON.stringify({ type: BRIDGE_TYPES.API, nonce, ...api })
}
