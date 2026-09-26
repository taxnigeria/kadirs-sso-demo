import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import '@/portals/home/home-landing.css'

export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}

export function UniversalNavbar({ showNotice = true }: { showNotice?: boolean }) {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)

  // Auto-close mobile navigation drawer on route change
  useEffect(() => {
    setNavOpen((prev) => (prev ? false : prev))
  }, [location.pathname])

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setNavOpen(false)

    if (location.pathname === '/') {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      navigate(`/#${id}`)
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }

  return (
    <div className="universal-navbar-wrap">
      {/* ── Official Notice Bar ── */}
      {showNotice && (
        <div className="notice-bar">
          <div className="container notice-bar__inner">
            <span className="notice-bar__pulse" />
            <span>Official notice</span>
            <p>2026 unified tax assessments &amp; vehicle licensing renewals are now open online.</p>
            <Link to="/paykaduna/services">
              Learn more <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Sticky Translucent Header ── */}
      <header className="site-header-sticky">
        <div className="container site-header">
          <Link className="brand" to="/" aria-label="KADIRS home">
            <LogoMark />
            <span className="brand__name">KADIRS</span>
            <span className="brand__descriptor">
              Unified Identity<br />Gateway
            </span>
          </Link>

          <nav className={`main-nav ${navOpen ? 'main-nav--open' : ''}`} aria-label="Main navigation">
            <a href="/#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
              How it works
            </a>
            <a href="/#services" onClick={(e) => scrollToSection(e, 'services')}>
              Services
            </a>
            <a href="/#trust" onClick={(e) => scrollToSection(e, 'trust')}>
              Trust &amp; privacy
            </a>
            <a href="/#support" onClick={(e) => scrollToSection(e, 'support')}>
              Support
            </a>

            {/* Mobile menu secondary items */}
            <div className="md:hidden pt-3 border-t border-[var(--line)] flex flex-col gap-2 mt-2">
              <a
                className="header-help"
                href="/#support"
                onClick={(e) => scrollToSection(e, 'support')}
              >
                Need help?
              </a>
              {currentUser ? (
                <Link className="button button--dark button--small" to="/paykaduna">
                  Dashboard <ArrowRight size={15} />
                </Link>
              ) : location.pathname === '/auth/login' ? (
                <Link className="button button--primary button--small" to="/auth/register">
                  Create account <ArrowRight size={15} />
                </Link>
              ) : (
                <Link className="button button--dark button--small" to="/auth/login">
                  Sign in <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </nav>

          <div className="header-actions">
            <a
              className="header-help hidden sm:inline-flex"
              href="/#support"
              onClick={(e) => scrollToSection(e, 'support')}
            >
              Need help?
            </a>

            {currentUser ? (
              <Link className="button button--dark button--small" to="/paykaduna">
                Dashboard <ArrowRight size={15} />
              </Link>
            ) : location.pathname === '/auth/login' ? (
              <Link className="button button--primary button--small" to="/auth/register">
                Create account <ArrowRight size={15} />
              </Link>
            ) : location.pathname === '/auth/register' ? (
              <Link className="button button--dark button--small" to="/auth/login">
                Sign in <ArrowRight size={15} />
              </Link>
            ) : (
              <Link className="button button--dark button--small" to="/auth/login">
                Sign in <ArrowRight size={15} />
              </Link>
            )}

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setNavOpen((prev) => !prev)}
              aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            >
              {navOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}
