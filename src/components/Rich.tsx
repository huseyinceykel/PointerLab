import type { ReactNode } from 'react'

/** **kalın** ve `kod` işaretlerini basitçe işler. */
export function Rich({ text }: { text: string }): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <strong key={i} className="text-white">{p.slice(2, -2)}</strong>
        ) : p.startsWith('`') ? (
          <code key={i} className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[0.9em] text-cyan">{p.slice(1, -1)}</code>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  )
}
