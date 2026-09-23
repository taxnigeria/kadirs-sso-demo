import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  Search,
  X,
  User,
  Shield,
  Building2,
  Landmark,
  LayoutDashboard,
  Car,
  Calculator,
  RotateCcw,
  Sun,
  Moon,
  Code2,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sliders,
  Check
} from 'lucide-react'
import { usePresentationStore } from '@/engine/presentation-store'
import { useInspectorStore } from '@/engine/inspector-store'
import { useThemeStore } from '@/engine/theme-store'
import { useAdminEngine } from '@/engine/admin-engine'
import { DEMO_PERSONAS } from '@/data/personas'
import { DEMO_ADMIN_STAFF } from '@/engine/admin-engine'
import { toast } from 'sonner'

type CategoryFilter = 'all' | 'citizens' | 'admins' | 'portals' | 'actions'

interface PaletteItem {
  id: string
  category: 'citizens' | 'admins' | 'portals' | 'actions'
  title: string
  subtitle: string
  badge: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor?: string
  action: () => void
  keywords?: string[]
}

export function CommandPalette() {
  const navigate = useNavigate()
  const isOpen = usePresentationStore((s) => s.isPaletteOpen)
  const closePalette = usePresentationStore((s) => s.closePalette)
  const togglePalette = usePresentationStore((s) => s.togglePalette)
  const switchCitizenPersona = usePresentationStore((s) => s.switchCitizenPersona)
  const switchAdminStaff = usePresentationStore((s) => s.switchAdminStaff)
  const resetAllDemoData = usePresentationStore((s) => s.resetAllDemoData)

  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const currentAdmin = useAdminEngine((s) => s.currentAdmin)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CategoryFilter>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        togglePalette()
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        closePalette()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, togglePalette, closePalette])

  // Focus input on open & reset search
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Define full command palette items
  const allItems: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = []

    // 1. Citizen & Entity Personas
    DEMO_PERSONAS.forEach((p) => {
      const isCorporate = Boolean(p.corporate)
      const isAgency = Boolean(p.agency)

      let icon = User
      let badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
      if (isCorporate) {
        icon = Building2
        badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      } else if (isAgency) {
        icon = Landmark
        badgeColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
      }

      items.push({
        id: `persona-${p.id}`,
        category: 'citizens',
        title: p.name,
        subtitle: `${p.role} · ${p.tagline}`,
        badge: isCorporate ? 'Corporate Entity' : isAgency ? 'Government Agency' : 'Individual Citizen',
        badgeColor,
        icon,
        action: () => switchCitizenPersona(p.id, navigate),
        keywords: [p.id, p.role, p.tagline, p.identity.nin, p.profile.citizenId, p.profile.email]
      })
    })

    // 2. Administrative Officers
    DEMO_ADMIN_STAFF.forEach((adm) => {
      items.push({
        id: `admin-${adm.id}`,
        category: 'admins',
        title: adm.name,
        subtitle: `${adm.role.replace('_', ' ').toUpperCase()} · ${adm.department} (${adm.fido2KeyName.split(' ')[0]})`,
        badge: 'FIDO2 AAL3 Admin',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: Shield,
        action: () => switchAdminStaff(adm.staffId, navigate),
        keywords: [adm.staffId, adm.email, adm.role, adm.department, 'fido2', 'security key', 'yubikey']
      })
    })

    // 3. Portals Navigation
    const portals = [
      {
        id: 'portal-home',
        title: 'Home & Central Access Portal',
        subtitle: 'Entry gateway with active persona quick cards and portal links',
        badge: 'Gateway',
        icon: Layers,
        path: '/'
      },
      {
        id: 'portal-paykaduna',
        title: 'PayKaduna Revenue Gateway',
        subtitle: 'Tax assessment, direct billing, payment processing and receipt verification',
        badge: 'TSP Portal',
        icon: LayoutDashboard,
        path: '/paykaduna'
      },
      {
        id: 'portal-services',
        title: 'Central Services Directory',
        subtitle: 'Browse state revenue services and initiate cross-agency applications',
        badge: 'Services',
        icon: Sliders,
        path: '/paykaduna/services'
      },
      {
        id: 'portal-profile',
        title: 'Citizen Profile & NDPA Privacy Center',
        subtitle: 'Manage verified identity, linked TSP consents, and NDPA erasure rights',
        badge: 'NDPA Center',
        icon: User,
        path: '/auth/profile'
      },
      {
        id: 'portal-kadvreg',
        title: 'KADVREG Vehicle Licensing & Fleet Platform',
        subtitle: 'External TSP: Vehicle registration, license renewals, and roadworthiness',
        badge: 'External TSP',
        icon: Car,
        path: '/kadvreg'
      },
      {
        id: 'portal-pit',
        title: 'Personal Income Tax (PIT) e-Tax Platform',
        subtitle: 'External TSP: Direct assessment, PAYE returns, and tax clearance certs',
        badge: 'External TSP',
        icon: Calculator,
        path: '/pit'
      },
      {
        id: 'portal-admin-dash',
        title: 'Central Administration Console — Overview',
        subtitle: 'Administrative dashboard, gateway telemetry, and compliance metrics',
        badge: 'Admin Console',
        icon: Shield,
        path: '/admin/dashboard'
      },
      {
        id: 'portal-admin-approvals',
        title: 'Admin Dual-Authorization Maker/Checker Queue',
        subtitle: 'Adjudicate agency onboardings, rep transfers, and dispute cases',
        badge: 'Admin Console',
        icon: ShieldAlert,
        path: '/admin/approvals'
      },
      {
        id: 'portal-admin-reports',
        title: 'Admin Statutory Reports & NDPA Compliance (CAR)',
        subtitle: 'Export NDPC compliance audit report and view immutable audit stream',
        badge: 'Admin Console',
        icon: Layers,
        path: '/admin/reports'
      }
    ]

    portals.forEach((p) => {
      items.push({
        id: p.id,
        category: 'portals',
        title: p.title,
        subtitle: p.subtitle,
        badge: p.badge,
        badgeColor: 'bg-[var(--line-soft)] text-[var(--ink-soft)] border-[var(--line)]',
        icon: p.icon,
        action: () => {
          closePalette()
          navigate(p.path)
        },
        keywords: [p.title, p.subtitle, p.path]
      })
    })

    // 4. System & Diagnostic Actions
    items.push({
      id: 'action-inspector',
      category: 'actions',
      title: 'Open Technical Architecture Inspector (Alt+I)',
      subtitle: 'Inspect live RS256 JWT tokens, Kafka event streams, and OAuth 2.0 PKCE sequence',
      badge: 'Admin Diagnostic',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: Code2,
      action: () => {
        closePalette()
        if (currentAdmin) {
          useInspectorStore.getState().openInspector()
        } else {
          // If not currently admin, automatically log in as Zainab (Super Admin) and open
          switchAdminStaff('KAD-STF-0012', navigate).then(() => {
            setTimeout(() => {
              useInspectorStore.getState().openInspector()
            }, 300)
          })
          toast.info('Architecture Inspector Opened', {
            description: 'Authenticated as Hajiya Zainab Idris (Super Admin) to access diagnostic suite.'
          })
        }
      },
      keywords: ['inspector', 'jwt', 'token', 'kafka', 'events', 'architecture', 'telemetry', 'pkce', 'crypto']
    })

    items.push({
      id: 'action-reset',
      category: 'actions',
      title: 'Reset All Demo Data to Seed State',
      subtitle: 'Clear all local modifications, re-seed pristine personas, and restore factory defaults',
      badge: 'System Action',
      badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      icon: RotateCcw,
      action: () => resetAllDemoData(navigate),
      keywords: ['reset', 'clear', 'wipe', 'seed', 'restore', 'factory', 'demo']
    })

    items.push({
      id: 'action-theme',
      category: 'actions',
      title: `Toggle Theme (Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode)`,
      subtitle: 'Switch application color palette between high-contrast light and dark themes',
      badge: 'Appearance',
      badgeColor: 'bg-[var(--line-soft)] text-[var(--ink-soft)] border-[var(--line)]',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        toggleTheme()
        toast.info(`Switched to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`)
      },
      keywords: ['theme', 'dark', 'light', 'mode', 'color', 'appearance']
    })

    return items
  }, [navigate, switchCitizenPersona, switchAdminStaff, resetAllDemoData, closePalette, currentAdmin, theme, toggleTheme])

  // Filter items by search query and category tab
  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim()
    return allItems.filter((item) => {
      // Category filter
      if (filter !== 'all' && item.category !== filter) {
        return false
      }
      // Query filter
      if (!q) return true
      const matchTitle = item.title.toLowerCase().includes(q)
      const matchSubtitle = item.subtitle.toLowerCase().includes(q)
      const matchBadge = item.badge.toLowerCase().includes(q)
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q))
      return matchTitle || matchSubtitle || matchBadge || matchKeywords
    })
  }, [allItems, query, filter])

  // Reset selected index when list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length, filter, query])

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1))
      scrollActiveIntoView()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1))
      scrollActiveIntoView()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        selected.action()
      }
    }
  }

  const scrollActiveIntoView = () => {
    setTimeout(() => {
      const activeEl = listRef.current?.querySelector('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }, 10)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={closePalette}
    >
      <div
        className="w-full max-w-2xl bg-[var(--paper)] border border-[var(--line)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all animate-in zoom-in-95 duration-150 text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--line)] bg-[var(--paper-raised)]">
          <Search className="w-5 h-5 text-[var(--ink-soft)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search personas, admin officers, portals, or actions..."
            className="flex-1 bg-transparent text-[var(--ink)] placeholder-[var(--ink-soft)] text-sm focus:outline-hidden"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--ink-soft)] bg-[var(--line-soft)] border border-[var(--line)] rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Filter Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--line)] bg-[var(--paper)] overflow-x-auto text-xs shrink-0">
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'citizens', label: 'Citizens & Entities' },
              { id: 'admins', label: 'Admin Officers' },
              { id: 'portals', label: 'Portals' },
              { id: 'actions', label: 'Actions' }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                filter === t.id
                  ? 'bg-[var(--green)] text-white'
                  : 'bg-[var(--line-soft)] text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--line)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 divide-y divide-[var(--line)]/50 focus:outline-hidden"
          tabIndex={-1}
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--ink-soft)]">
              No matching personas, portals, or actions found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  data-active={isSelected}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--green)]/10 text-[var(--ink)] border-l-4 border-[var(--green)]'
                      : 'hover:bg-[var(--paper-raised)] text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-[var(--green)] text-white border-[var(--green)]'
                          : 'bg-[var(--paper-raised)] text-[var(--ink-soft)] border-[var(--line)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate">{item.title}</span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                            item.badgeColor || 'bg-[var(--line-soft)] text-[var(--ink-soft)] border-[var(--line)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-medium text-[var(--green)]">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-[var(--ink-soft)] opacity-0 group-hover:opacity-100">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer with keyboard shortcuts info */}
        <div className="px-4 py-2.5 bg-[var(--paper-raised)] border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--ink-soft)] shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper)] border border-[var(--line)] rounded">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper)] border border-[var(--line)] rounded">
                ↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper)] border border-[var(--line)] rounded">
                ↵
              </kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper)] border border-[var(--line)] rounded">
                esc
              </kbd>
              <span>dismiss</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <span>Toggle anywhere with</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--paper)] border border-[var(--line)] rounded font-semibold text-[var(--ink)]">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
