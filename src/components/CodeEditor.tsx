import { useEffect, useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor/editor.api'
import 'monaco-editor/languages/definitions/cpp/register'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

// Monaco'yu CDN yerine paketten yükle: internet olmadan da çalışır.
;(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })

export interface Marker {
  line: number
  message: string
}

interface Props {
  value: string
  onChange?: (v: string) => void
  activeLine?: number
  activeKind?: 'ok' | 'ub'
  errors?: Marker[]
  readOnly?: boolean
  height?: string | number
}

export default function CodeEditor({ value, onChange, activeLine = 0, activeKind = 'ok', errors = [], readOnly, height = 320 }: Props) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const decoRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null)

  const apply = () => {
    const ed = editorRef.current
    const model = ed?.getModel()
    if (!ed || !model) return
    const decos: monaco.editor.IModelDeltaDecoration[] = []
    if (activeLine > 0 && activeLine <= model.getLineCount()) {
      decos.push({
        range: new monaco.Range(activeLine, 1, activeLine, 1),
        options: { isWholeLine: true, className: activeKind === 'ub' ? 'pl-ub-line' : 'pl-current-line' },
      })
    }
    for (const e of errors) {
      if (e.line > 0 && e.line <= model.getLineCount()) {
        decos.push({ range: new monaco.Range(e.line, 1, e.line, 1), options: { isWholeLine: true, className: 'pl-error-line' } })
      }
    }
    decoRef.current?.clear()
    decoRef.current = ed.createDecorationsCollection(decos)
    monaco.editor.setModelMarkers(
      model,
      'pointerlab',
      errors
        .filter((e) => e.line > 0 && e.line <= model.getLineCount())
        .map((e) => ({
          severity: monaco.MarkerSeverity.Error,
          message: e.message,
          startLineNumber: e.line,
          startColumn: 1,
          endLineNumber: e.line,
          endColumn: model.getLineMaxColumn(e.line),
        })),
    )
  }

  useEffect(apply, [activeLine, activeKind, errors, value])

  return (
    <Editor
      height={height}
      language="c"
      theme="pointerlab"
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      beforeMount={(m) => {
        m.editor.defineTheme('pointerlab', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: { 'editor.background': '#0a0f1e', 'editorLineNumber.foreground': '#475569' },
        })
      }}
      onMount={(ed) => {
        editorRef.current = ed
        apply()
      }}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 15,
        lineHeight: 24,
        scrollBeyondLastLine: false,
        padding: { top: 10 },
        automaticLayout: true,
        renderLineHighlight: 'none',
        glyphMargin: false,
        ariaLabel: 'C kod editörü',
        fontFamily: 'JetBrains Mono, ui-monospace, Menlo, monospace',
      }}
    />
  )
}
