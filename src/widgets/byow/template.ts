export interface WidgetCode {
  html: string
  css: string
  js: string
}

export const WIDGET_CODE_TEMPLATE: WidgetCode = {
  html: '<!-- Hello from DeskMate! -->\n<h1>My widget</h1>\n<p>window.deskmate gives you theme + size.</p>',
  css: 'h1 { color: var(--deskmate-accent); }',
  js: '// window.deskmate = { theme, size, config }\n// window.deskmate.onUpdate((api) => console.log(api));\nconsole.log("hello from DeskMate");',
}
