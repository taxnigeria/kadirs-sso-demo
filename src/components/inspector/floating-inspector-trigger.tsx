import { Code2 } from 'lucide-react'
import { useInspectorStore } from '@/engine/inspector-store'
import { useAdminEngine } from '@/engine/admin-engine'

export function FloatingInspectorTrigger() {
  const isOpen = useInspectorStore((s) => s.isOpen)
  const toggleInspector = useInspectorStore((s) => s.toggleInspector)
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)

  // Only display for authenticated administrators
  if (isOpen || !currentAdmin) return null

  return (
    <button
      type="button"
      onClick={toggleInspector}
      title="Open Technical Architecture Inspector (Alt+I)"
      className="fixed bottom-4 right-4 z-40 bg-[var(--ink)] hover:bg-[#1A383D] dark:bg-[var(--paper-raised)] dark:hover:bg-[var(--line-soft)] text-white dark:text-[var(--ink)] border border-[var(--line)] px-3 py-2 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer group hover:scale-105 active:scale-95"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>

      <Code2 className="w-3.5 h-3.5 text-emerald-400 dark:text-[var(--green)] group-hover:rotate-12 transition-transform" />

      <span className="font-sans font-semibold text-xs tracking-tight">
        Inspect Auth 2.0
      </span>

      <span className="hidden sm:inline-block font-mono text-[9.5px] px-1.5 py-0.2 rounded bg-white/20 dark:bg-black/10 text-white dark:text-[var(--ink-soft)] font-medium">
        Alt+I
      </span>
    </button>
  )
}
