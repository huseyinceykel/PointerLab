/// <reference types="vite/client" />
declare module 'monaco-editor/editor/editor.worker?worker' {
  const W: new () => Worker
  export default W
}
declare module 'monaco-editor/editor/editor.api' {
  export * from 'monaco-editor'
}
declare module 'monaco-editor/languages/definitions/cpp/register'
