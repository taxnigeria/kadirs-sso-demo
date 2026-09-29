import { useState } from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  ArrowRight,
  ArrowDownRight,
  Check,
  LockKeyhole
} from 'lucide-react'
import { useInspectorStore } from '@/engine/inspector-store'
import { usePresentationStore } from '@/engine/presentation-store'
import { PayKadunaLogo } from '@/components/layout/paykaduna-logo'
import { PayKadunaHero } from './paykaduna-hero'
import ibsLogoImg from '@/assets/ibs-logo.png'
import ndpcLogoImg from '@/assets/ndpc-logo.png'
import pcidssLogoImg from '@/assets/pcidss-logo.png'
import isoLogoImg from '@/assets/information-security-logo.png'
import './home-landing.css'

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

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(1)

  const openInspector = useInspectorStore((s) => s.openInspector)
  const openPalette = usePresentationStore((s) => s.openPalette)

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="site-shell">
      {/* ── PayKaduna Flagship Hero Section ── */}
      <PayKadunaHero />

      {/* ── Main Content ── */}
      <main id="top">

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

        {/* Quote Section (Full-Bleed Editorial White) */}
        <div className="quote-section-wrap">
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
        </div>

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
            <a className="brand brand--footer flex items-center gap-2" href="#top" aria-label="Back to top">
              <PayKadunaLogo
                markSize="md"
                textClassName="text-[var(--ink)] dark:text-white font-black tracking-wider text-base"
                subtitle="Central Identity & Revenue Gateway"
              />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span>© 2026 Kaduna State Internal Revenue Service</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.92)', padding: '3px 10px', borderRadius: '9999px' }}>
              <img src={ibsLogoImg} alt="IBS" style={{ height: '18px', width: 'auto' }} />
              <img src={ndpcLogoImg} alt="NDPC" style={{ height: '18px', width: 'auto' }} />
              <img src={pcidssLogoImg} alt="PCI DSS" style={{ height: '18px', width: 'auto' }} />
              <img src={isoLogoImg} alt="ISO 27001" style={{ height: '18px', width: 'auto' }} />
            </div>
          </div>
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
