import { useState } from 'react'
import { Link } from 'react-router'
import { IndividualFlow } from './register/individual-flow'
import { CorporateFlow } from './register/corporate-flow'
import { AgencyFlow } from './register/agency-flow'

export type RegistrationPath = 'individual' | 'corporate' | 'agency'

export default function RegisterPage() {
  const [selectedPath, setSelectedPath] = useState<RegistrationPath>('individual')
  const [isStarted, setIsStarted] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Single source of truth for the steps of each path
  const steps = selectedPath === 'individual'
    ? ['Choose path', 'NIN Verification', 'Contact & OTP', 'Tax Jurisdiction', 'Security & 2FA', 'Consent']
    : selectedPath === 'corporate'
    ? ['Choose path', 'CAC RC Lookup', 'Corporate Profile', 'Signatory & Credentials']
    : ['Choose path', 'Agency details', 'Mandate & signatory', 'Review', 'Submission']

  // Master active step index (0 when choosing path, 1+ when inside flow)
  const activeIndex = isStarted ? currentStepIndex + 1 : 0

  const handleStart = () => {
    setIsStarted(true)
    setCurrentStepIndex(0)
  }

  const handleBackToSelection = () => {
    setIsStarted(false)
    setCurrentStepIndex(0)
  }

  return (
    <div className={`max-w-[920px] mx-auto px-6 sm:px-8 ${isStarted ? 'pt-4 sm:pt-6' : 'pt-10'} pb-24 transition-all`}>
      {/* Editorial Intro Headline — Hidden once a registration path is chosen */}
      {!isStarted && (
        <div className="mb-10 animate-in fade-in">
          <h1 className="font-serif font-normal text-3xl sm:text-4xl text-[var(--ink)] tracking-tight leading-[1.15] mb-2.5 max-w-[15ch]">
            Register once, reach every state service
          </h1>
          {/* Subtitle formatted strictly onto 2 lines */}
          <p className="font-sans text-[15px] text-[var(--ink-soft)] leading-relaxed max-w-[72ch]">
            One verified identity gives Kaduna citizens, businesses and government agencies unified<br className="hidden sm:inline" />
            single sign-on access to all fourteen state revenue and tax services.
          </p>
        </div>
      )}

      {/* SINGLE Stepper Bar across entire page — Sticky, no duplicate row, no scroll wheel, backdrop blur */}
      <div className="sticky top-0 z-30 bg-[var(--paper)]/95 backdrop-blur-md flex border-t border-b border-[var(--line)] mb-8 sm:mb-10 overflow-hidden no-scrollbar shadow-2xs transition-all">
        {steps.map((stepName, idx) => {
          const isActive = idx === activeIndex
          const isDone = idx < activeIndex
          return (
            <div
              key={stepName}
              className="flex-1 min-w-[120px] px-4 py-3.5 border-r border-[var(--line)] last:border-r-0 relative bg-transparent transition-colors"
            >
              <div
                className={`font-serif text-[13px] ${
                  isDone
                    ? 'text-[var(--green)] font-semibold'
                    : isActive
                    ? 'text-[var(--ink)] font-semibold'
                    : 'text-[var(--ink-soft)]'
                }`}
              >
                {isDone ? '✓ ' : ''}{String(idx + 1).padStart(2, '0')}
              </div>
              <div
                className={`text-[13.5px] mt-0.5 whitespace-nowrap ${
                  isActive ? 'text-[var(--ink)] font-semibold' : 'text-[var(--ink-soft)]'
                }`}
              >
                {stepName}
              </div>
              {isActive && (
                <div className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[var(--green)]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Main Content Area */}
      {!isStarted ? (
        <div className="space-y-7">
          {/* 3 Path Selection Cards in connected 1px border grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[var(--line)] border border-[var(--line)]">
            {/* Path A: Individual */}
            <div
              onClick={() => setSelectedPath('individual')}
              className={`p-6 sm:p-7 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPath === 'individual'
                  ? 'bg-[var(--path-selected-bg)] ring-2 ring-[var(--green)] shadow-xs'
                  : 'bg-[var(--paper-raised)] hover:bg-[var(--line-soft)]/60'
              }`}
            >
              <div className="flex-1 flex flex-col">
                <div className="text-[11px] text-[var(--ink-soft)] mb-3.5 tracking-wide">
                  Path A &middot; R1.0
                </div>
                <h3 className="font-serif font-semibold text-[19px] text-[var(--ink)] mb-2">
                  Individual citizen
                </h3>
                <p className="text-[13.5px] text-[var(--ink-soft)] leading-relaxed mb-6">
                  Personal taxpayers, vehicle owners, drivers, artisans and landlords.
                </p>
              </div>
              {/* Perfectly aligned footer */}
              <div className="border-t border-[var(--line-soft)] pt-3 text-[12.5px] text-[var(--green)] font-medium min-h-[46px] flex items-center">
                11-digit NIN / vNIN token, biometric lock
              </div>
            </div>

            {/* Path B: Corporate */}
            <div
              onClick={() => setSelectedPath('corporate')}
              className={`p-6 sm:p-7 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPath === 'corporate'
                  ? 'bg-[var(--path-selected-bg)] ring-2 ring-[var(--green)] shadow-xs'
                  : 'bg-[var(--paper-raised)] hover:bg-[var(--line-soft)]/60'
              }`}
            >
              <div className="flex-1 flex flex-col">
                <div className="text-[11px] text-[var(--ink-soft)] mb-3.5 tracking-wide">
                  Path B &middot; R1.0
                </div>
                <h3 className="font-serif font-semibold text-[19px] text-[var(--ink)] mb-2">
                  Corporate entity
                </h3>
                <p className="text-[13.5px] text-[var(--ink-soft)] leading-relaxed mb-6">
                  Limited companies, enterprises and registered business partnerships.
                </p>
              </div>
              {/* Perfectly aligned footer */}
              <div className="border-t border-[var(--line-soft)] pt-3 text-[12.5px] text-[var(--green)] font-medium min-h-[46px] flex items-center">
                CAC RC number + representative NIN
              </div>
            </div>

            {/* Path C: Agency */}
            <div
              onClick={() => setSelectedPath('agency')}
              className={`p-6 sm:p-7 cursor-pointer transition-all flex flex-col justify-between ${
                selectedPath === 'agency'
                  ? 'bg-[var(--path-selected-bg)] ring-2 ring-[var(--green)] shadow-xs'
                  : 'bg-[var(--paper-raised)] hover:bg-[var(--line-soft)]/60'
              }`}
            >
              <div className="flex-1 flex flex-col">
                <div className="text-[11px] text-[var(--ink-soft)] mb-3.5 tracking-wide">
                  Path C &middot; R1.0
                </div>
                <h3 className="font-serif font-semibold text-[19px] text-[var(--ink)] mb-2">
                  Government agency
                </h3>
                <p className="text-[13.5px] text-[var(--ink-soft)] leading-relaxed mb-6">
                  Kaduna State MDAs, federal parastatals and LGA council authorities.
                </p>
              </div>
              {/* Perfectly aligned footer */}
              <div className="border-t border-[var(--line-soft)] pt-3 text-[12.5px] text-[var(--green)] font-medium min-h-[46px] flex items-center">
                TIN + gazette mandate, maker/checker review
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-[var(--ink-soft)]">
              Already registered?{' '}
              <Link to="/auth/login" className="text-[var(--green)] font-medium hover:underline">
                Sign in to existing account &rarr;
              </Link>
            </span>

            <button
              onClick={handleStart}
              className="bg-[var(--green)] hover:bg-[var(--green-deep)] text-white px-6 py-2.5 rounded-[var(--radius)] font-sans text-sm font-medium transition-colors"
            >
              Continue &nbsp;&rarr;
            </button>
          </div>
        </div>
      ) : (
        /* Render Selected Flow (without duplicate tabs) */
        <div>
          {selectedPath === 'individual' && (
            <IndividualFlow
              onBackToSelection={handleBackToSelection}
              onStepChange={setCurrentStepIndex}
            />
          )}
          {selectedPath === 'corporate' && (
            <CorporateFlow
              onBackToSelection={handleBackToSelection}
              onStepChange={setCurrentStepIndex}
            />
          )}
          {selectedPath === 'agency' && (
            <AgencyFlow
              onBackToSelection={handleBackToSelection}
              onStepChange={setCurrentStepIndex}
            />
          )}
        </div>
      )}
    </div>
  )
}
