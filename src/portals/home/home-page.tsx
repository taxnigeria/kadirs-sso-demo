import { useState } from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  LockKeyhole,
  Sparkles,
  Menu,
  X
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useInspectorStore } from '@/engine/inspector-store'
import { usePresentationStore } from '@/engine/presentation-store'
import './home-landing.css'

const servicesData = [
  { code: '01', name: 'PayKaduna', detail: 'Revenue & payments' },
  { code: '02', name: 'KADVREG', detail: 'Vehicle licensing' },
  { code: '03', name: 'PIT', detail: 'Personal income tax' }
]

const trustCardsData = [
  {
    index: '01',
    title: 'Verify once',
    body: 'Your National ID confirms who you are directly with NIMC—no repeated paperwork across portals.',
    icon: ShieldCheck
  },
  {
    index: '02',
    title: 'Move freely',
    body: 'Open every connected Kaduna service from one account, without starting a new login each time.',
    icon: ArrowDownRight
  },
  {
    index: '03',
    title: 'Stay in control',
    body: 'See what is connected, manage your data permissions, and keep your public records together.',
    icon: LockKeyhole
  }
]

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}

function ServiceBadge({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="service-badge">
      <div className="service-badge__dot" />
      <div>
        <p>{name}</p>
        <span>{detail}</span>
      </div>
      <Check size={14} strokeWidth={2.3} />
    </div>
  )
}

function IdentityDiagram() {
  return (
    <div
      className="identity-diagram"
      aria-label="One verified identity connecting three Kaduna public services"
    >
      <div className="diagram-orbit orbit-one" />
      <div className="diagram-orbit orbit-two" />
      <div className="diagram-line line-one" />
      <div className="diagram-line line-two" />
      <div className="diagram-line line-three" />
      <div className="diagram-node node-paykaduna">
        <span>PK</span>
        <small>PayKaduna</small>
      </div>
      <div className="diagram-node node-kadvreg">
        <span>KV</span>
        <small>KADVREG</small>
      </div>
      <div className="diagram-node node-pit">
        <span>PI</span>
        <small>PIT</small>
      </div>
      <div className="identity-core">
        <div className="core-ring">
          <span className="core-dot" />
          <span className="core-dot core-dot--two" />
          <span className="core-dot core-dot--three" />
          <ShieldCheck size={29} strokeWidth={1.7} />
        </div>
        <strong>NIN</strong>
        <small>verified identity</small>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [navOpen, setNavOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  const currentUser = useAuthEngine((s) => s.currentUser)
  const openInspector = useInspectorStore((s) => s.openInspector)
  const openPalette = usePresentationStore((s) => s.openPalette)

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setNavOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="site-shell">
      {/* ── Notice Bar ── */}
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

      {/* ── Site Header ── */}
      <header className="site-header container">
        <a className="brand" href="#top" aria-label="KADIRS home">
          <LogoMark />
          <span className="brand__name">KADIRS</span>
          <span className="brand__descriptor">
            Unified Identity<br />Gateway
          </span>
        </a>

        <nav className={`main-nav ${navOpen ? 'main-nav--open' : ''}`} aria-label="Main navigation">
          <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
            How it works
          </a>
          <a href="#services" onClick={(e) => scrollToSection(e, 'services')}>
            Services
          </a>
          <a href="#trust" onClick={(e) => scrollToSection(e, 'trust')}>
            Trust &amp; privacy
          </a>
          <a href="#support" onClick={(e) => scrollToSection(e, 'support')}>
            Support
          </a>
        </nav>

        <div className="header-actions">
          <a className="header-help" href="#support" onClick={(e) => scrollToSection(e, 'support')}>
            Need help?
          </a>

          {currentUser ? (
            <Link className="button button--dark button--small" to="/paykaduna">
              Dashboard <ArrowRight size={15} />
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
      </header>

      {/* ── Main Content ── */}
      <main id="top">
        {/* Hero Section */}
        <section className="hero container">
          <div className="hero__copy">
            <div className="eyebrow">
              <span className="eyebrow__line" />
              KADIRS central identity gateway
            </div>

            <h1>
              One identity.<br />
              <em>Every</em> public service.
            </h1>

            <p className="hero__intro">
              A simpler way to access Kaduna State tax, revenue, and vehicle services.
              Verify your identity once, then move between connected portals without starting over.
            </p>

            <div className="hero__actions">
              <Link className="button button--primary" to="/auth/register">
                Create your account <ArrowRight size={16} />
              </Link>
              <a
                className="text-link"
                href="#how-it-works"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
              >
                See how it works <ArrowDownRight size={16} />
              </a>
            </div>

            <div className="hero__meta">
              <span>
                <span className="meta-check">
                  <Check size={11} />
                </span>
                NIMC verified
              </span>
              <span>
                <span className="meta-check">
                  <Check size={11} />
                </span>
                NDPA protected
              </span>
              <span>
                <span className="meta-check">
                  <Check size={11} />
                </span>
                14 connected MDAs
              </span>
            </div>
          </div>

          <div className="hero__visual-wrap">
            <div className="hero__visual-label">
              Your digital identity <span>01 / 03</span>
            </div>

            <div className="hero__visual">
              <div className="visual-topline">
                <span>SSO / KADIRS</span>
                <span>ACTIVE</span>
              </div>

              <IdentityDiagram />

              <div className="visual-footer">
                <div>
                  <span className="status-dot" />
                  <strong>Identity verified</strong>
                  <small>Last checked just now</small>
                </div>
                <span className="visual-footer__arrow">
                  <ArrowUpRight size={15} />
                </span>
              </div>
            </div>

            <div className="visual-note">
              <Sparkles size={14} />
              One secure sign-on across your Kaduna records.
            </div>
          </div>
        </section>

        {/* Service Strip */}
        <section className="service-strip" id="services">
          <div className="container service-strip__inner">
            <p className="service-strip__label">One gateway for</p>
            <div className="service-strip__items">
              {servicesData.map((s) => (
                <ServiceBadge key={s.code} name={s.name} detail={s.detail} />
              ))}
            </div>
            <Link to="/paykaduna/services" className="service-strip__count">
              + 11 more<br />connected services
            </Link>
          </div>
        </section>

        {/* The SSO Difference (Story Section) */}
        <section className="section section--story" id="how-it-works">
          <div className="container story-grid">
            <div className="section-heading">
              <div className="eyebrow">
                <span className="eyebrow__line" />
                The SSO difference
              </div>
              <h2>
                SSO should feel like <em>one door,</em> not three queues.
              </h2>
              <p>
                Public services work better when your identity follows you.
                KADIRS brings your state records into one clear, secure starting point.
              </p>
              <Link className="text-link" to="/auth/login">
                Experience the 1-click flow <ArrowRight size={16} />
              </Link>
            </div>

            <div className="step-list">
              <div
                className={`step-card ${activeStep === 1 ? 'step-card--active' : ''}`}
                onClick={() => setActiveStep(1)}
                role="button"
                tabIndex={0}
              >
                <span className="step-card__number">01</span>
                <div>
                  <h3>Sign in once</h3>
                  <p>Your NIN becomes the secure key to your connected services.</p>
                </div>
                <span className="step-card__icon">
                  <LockKeyhole size={18} />
                </span>
              </div>

              <div
                className={`step-card ${activeStep === 2 ? 'step-card--active' : ''}`}
                onClick={() => setActiveStep(2)}
                role="button"
                tabIndex={0}
              >
                <span className="step-card__number">02</span>
                <div>
                  <h3>Records find you</h3>
                  <p>Past payments, vehicle records, and tax profiles are matched automatically.</p>
                </div>
                <span className="step-card__icon">
                  <ArrowDownRight size={18} />
                </span>
              </div>

              <div
                className={`step-card ${activeStep === 3 ? 'step-card--active' : ''}`}
                onClick={() => setActiveStep(3)}
                role="button"
                tabIndex={0}
              >
                <span className="step-card__number">03</span>
                <div>
                  <h3>Keep moving</h3>
                  <p>Switch between services without duplicate accounts or repeated verification.</p>
                </div>
                <span className="step-card__icon">
                  <Check size={18} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Built Around Trust Section */}
        <section className="section section--trust" id="trust">
          <div className="container">
            <div className="trust-intro">
              <div className="eyebrow">
                <span className="eyebrow__line" />
                Built around trust
              </div>
              <h2>
                Less friction for you.<br />
                <em>More clarity</em> in the system.
              </h2>
              <p>
                Every part of the gateway is designed to make public services easier to understand,
                easier to reach, and safer to use.
              </p>
            </div>

            <div className="trust-grid">
              {trustCardsData.map(({ index, title, body, icon: Icon }) => (
                <article key={index} className="trust-card">
                  <div className="trust-card__top">
                    <span>{index}</span>
                    <Icon size={20} strokeWidth={1.6} />
                  </div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <div className="trust-card__rule" />
                  <span className="trust-card__tag">KADIRS / SSO</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="quote-section container">
          <div className="quote-section__mark">“</div>
          <blockquote>
            When identity is simple, public service can feel like it belongs to everyone.
          </blockquote>
          <div className="quote-section__source">
            <span />
            Kaduna State Internal Revenue Service
            <span />
            Central Identity Initiative
          </div>
        </section>

        {/* Support Section */}
        <section className="support-section" id="support">
          <div className="container support-grid">
            <div>
              <div className="eyebrow eyebrow--light">
                <span className="eyebrow__line" />
                Need a hand?
              </div>
              <h2>
                We’re here to help you <em>get through.</em>
              </h2>
              <p>
                Questions about your tax assessment, vehicle title, or NIN matching?
                Our taxpayer support team is ready.
              </p>
            </div>

            <div className="support-card">
              <div className="support-card__item">
                <span>General enquiries</span>
                <strong>taxpayer.support@kadirs.gov.ng</strong>
              </div>

              <div className="support-card__item">
                <span>Helpline</span>
                <strong>
                  +234 800-KADIRS <small>(Toll free)</small>
                </strong>
              </div>

              <Link className="button button--mint" to="/paykaduna/services">
                Visit the support centre <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Site Footer ── */}
      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a className="brand brand--footer" href="#top" aria-label="Back to top">
              <LogoMark />
              <span className="brand__name">KADIRS</span>
            </a>
            <p>
              Central Identity &amp; Revenue Gateway.<br />
              Serving Kaduna State with clarity.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <span>Citizen portals</span>
              <Link to="/paykaduna">PayKaduna Revenue</Link>
              <Link to="/kadvreg">Vehicle licensing</Link>
              <Link to="/pit">Personal income tax</Link>
            </div>
            <div>
              <span>Company</span>
              <a href="#how-it-works" onClick={(e) => scrollToSection(e, 'how-it-works')}>
                How it works
              </a>
              <a href="#trust" onClick={(e) => scrollToSection(e, 'trust')}>
                Privacy &amp; compliance
              </a>
              <a href="#support" onClick={(e) => scrollToSection(e, 'support')}>
                Contact support
              </a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <span>© 2026 Kaduna State Internal Revenue Service</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span>
              NDPA 2023 protected <span className="footer-bottom__dot" /> NIMC identity partner
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: 0.65 }}>
              <button
                type="button"
                onClick={() => openInspector('topology')}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                Architecture Inspector
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={openPalette}
                style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}
              >
                Command Palette
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
