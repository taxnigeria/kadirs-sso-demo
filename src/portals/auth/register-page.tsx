import { useState } from 'react'
import { Link } from 'react-router'
import {
  Scale,
  User,
  Building2,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Check
} from 'lucide-react'
import { IndividualFlow } from './register/individual-flow'
import { CorporateFlow } from './register/corporate-flow'
import { AgencyFlow } from './register/agency-flow'

export type RegistrationPath = 'individual' | 'corporate' | 'agency'

export default function RegisterPage() {
  const [selectedPath, setSelectedPath] = useState<RegistrationPath>('individual')
  const [isStarted, setIsStarted] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Steps for each path
  const steps = selectedPath === 'individual'
    ? ['Choose Path', 'National ID (NIN)', 'Phone & Contact', 'Tax Office', 'Security & 2FA', 'Consent']
    : selectedPath === 'corporate'
    ? ['Choose Path', 'CAC RC Lookup', 'Company Profile', 'Director Credentials']
    : ['Choose Path', 'Agency Details', 'Official Mandate', 'Review & Submit']

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
    <div className={`max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 ${isStarted ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-6'} pb-16 transition-all`}>
      {/* Editorial Header — Shown before starting */}
      {!isStarted && (
        <div className="mb-4 sm:mb-6 text-center max-w-xl mx-auto space-y-1.5 animate-in fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#1AA260]/10 text-[#1AA260] text-xs font-semibold uppercase tracking-wider mb-0.5">
            <Scale className="w-3.5 h-3.5" />
            <span>Official Citizen Registration</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            Create Your Kaduna State Account
          </h1>
          <p className="text-xs sm:text-sm text-[var(--gray-700)] leading-relaxed max-w-md mx-auto">
            One verified digital account for citizens, businesses, and government agencies.
          </p>
        </div>
      )}

      {/* Modern Stepper Progress Bar */}
      <div className="sticky top-0 z-30 bg-[var(--card-bg)] text-[var(--ink)] rounded-2xl shadow-float mb-5 sm:mb-6 p-1.5 transition-all overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max sm:min-w-full">
          {steps.map((stepName, idx) => {
            const isActive = idx === activeIndex
            const isDone = idx < activeIndex

            return (
              <div
                key={stepName}
                className="flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                    isDone
                      ? 'bg-[#1AA260] text-white'
                      : isActive
                      ? 'bg-[#123D35] text-white ring-2 ring-[#1AA260]'
                      : 'bg-black/[0.05] dark:bg-white/[0.08] text-[var(--gray-500)]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <span
                    className={`block text-xs font-medium truncate ${
                      isActive
                        ? 'text-[var(--ink)] font-bold'
                        : isDone
                        ? 'text-[#1AA260] font-semibold'
                        : 'text-[var(--gray-500)]'
                    }`}
                  >
                    {stepName}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`hidden lg:block flex-1 h-[2px] mx-1 transition-all ${
                      idx < activeIndex ? 'bg-[#1AA260]' : 'bg-[var(--gray-200)]'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {!isStarted ? (
        <div className="space-y-6">
          {/* Pathway Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Path A: Individual */}
            <div
              onClick={() => setSelectedPath('individual')}
              className={`rounded-[24px] p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                selectedPath === 'individual'
                  ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-float-hover ring-2 ring-[#1AA260] scale-[1.03] opacity-100 z-10'
                  : 'bg-[var(--card-bg)]/75 text-[var(--ink)] shadow-float scale-100 opacity-60 hover:opacity-90 hover:scale-[1.01]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  {selectedPath === 'individual' && (
                    <div className="w-5 h-5 rounded-full bg-[#1AA260] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-1.5">
                  Individual Citizen
                </h3>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  For residents, salary earners, vehicle owners, drivers, artisans, and property owners.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--gray-200)] flex items-center justify-between text-xs">
                <span className="text-[var(--gray-500)]">Requirements:</span>
                <span className="font-medium text-[var(--gray-700)]">11-Digit NIN</span>
              </div>
            </div>

            {/* Path B: Corporate */}
            <div
              onClick={() => setSelectedPath('corporate')}
              className={`rounded-[24px] p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                selectedPath === 'corporate'
                  ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-float-hover ring-2 ring-[#1AA260] scale-[1.03] opacity-100 z-10'
                  : 'bg-[var(--card-bg)]/75 text-[var(--ink)] shadow-float scale-100 opacity-60 hover:opacity-90 hover:scale-[1.01]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  {selectedPath === 'corporate' && (
                    <div className="w-5 h-5 rounded-full bg-[#1AA260] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-1.5">
                  Corporate Entity
                </h3>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  For registered limited liability companies, business names, enterprises, and partnerships.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--gray-200)] flex items-center justify-between text-xs">
                <span className="text-[var(--gray-500)]">Requirements:</span>
                <span className="font-medium text-[var(--gray-700)]">CAC RC &amp; Director NIN</span>
              </div>
            </div>

            {/* Path C: Agency */}
            <div
              onClick={() => setSelectedPath('agency')}
              className={`rounded-[24px] p-5 sm:p-6 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                selectedPath === 'agency'
                  ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-float-hover ring-2 ring-[#1AA260] scale-[1.03] opacity-100 z-10'
                  : 'bg-[var(--card-bg)]/75 text-[var(--ink)] shadow-float scale-100 opacity-60 hover:opacity-90 hover:scale-[1.01]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  {selectedPath === 'agency' && (
                    <div className="w-5 h-5 rounded-full bg-[#1AA260] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <h3 className="font-display font-bold text-lg text-[var(--ink)] mb-1.5">
                  Government Agency
                </h3>
                <p className="text-xs text-[var(--gray-700)] leading-relaxed mb-4">
                  For Kaduna State MDAs, ministries, federal parastatals, and LGA council authorities.
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--gray-200)] flex items-center justify-between text-xs">
                <span className="text-[var(--gray-500)]">Requirements:</span>
                <span className="font-medium text-[var(--gray-700)]">Official State Mandate</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--gray-200)]">
            <span className="text-xs sm:text-sm text-[var(--gray-700)]">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-[#1AA260] font-semibold hover:underline">
                Sign in to existing account &rarr;
              </Link>
            </span>

            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-full bg-[#1AA260] hover:bg-[#158A52] text-white font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer self-end sm:self-auto group"
            >
              <span>Continue with {selectedPath === 'individual' ? 'Individual' : selectedPath === 'corporate' ? 'Corporate' : 'Agency'} Registration</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      ) : (
        /* Render Selected Flow */
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
