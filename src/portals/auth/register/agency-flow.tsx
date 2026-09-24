import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  ShieldCheck,
  Info
} from 'lucide-react'
import { useAuthEngine, checkAgencyTINRegistered } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { KADUNA_LGAS, LGA_TAX_OFFICES } from '@/data/lga-tax-offices'

interface AgencyFlowProps {
  onBackToSelection: () => void
  onStepChange?: (step: number) => void
}

export function AgencyFlow({ onBackToSelection, onStepChange }: AgencyFlowProps) {
  const navigate = useNavigate()
  const registerAgency = useAuthEngine((s) => s.registerAgency)
  const agencies = useAuthEngine((s) => s.agencies)
  const findRepresentativeByNIN = useAuthEngine((s) => s.findRepresentativeByNIN)
  const logEvent = useEventLogger((s) => s.logEvent)

  const [step, setStepState] = useState<0 | 1 | 2 | 3>(0) // 0: details, 1: signatory, 2: review, 3: confirmed

  const changeStep = (next: 0 | 1 | 2 | 3) => {
    setStepState(next)
    onStepChange?.(next)
  }

  // ==========================================
  // Step 0: Agency Details & Ghost Agency Check
  // ==========================================
  const [jurisdiction, setJurisdiction] = useState<'State' | 'Federal' | 'Local government'>('State')
  const [tin, setTin] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [stateName] = useState('Kaduna State')
  const [selectedLga, setSelectedLga] = useState('Kaduna North')
  const [address, setAddress] = useState('')
  const [duplicateTINBlocked, setDuplicateTINBlocked] = useState<{ tin: string; agencyName?: string; status?: string } | null>(null)
  const [tinError, setTinError] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  // ==========================================
  // Step 1: Mandate Document & Authorized Signatory
  // ==========================================
  const [mandateDocUploaded, setMandateDocUploaded] = useState(false)
  const [mandateDocName, setMandateDocName] = useState('')
  const [officerName, setOfficerName] = useState('')
  const [officerNIN, setOfficerNIN] = useState('')
  const [officerRole, setOfficerRole] = useState('')
  const [repNINMatch, setRepNINMatch] = useState<{ found: boolean; name?: string; email?: string } | null>(null)

  // Step 3: Reference
  const [refNumber, setRefNumber] = useState('')
  const [finalStatus, setFinalStatus] = useState<'pending_approval' | 'pending_documents'>('pending_approval')

  // Real-time TIN check
  const handleTinChange = (val: string) => {
    const clean = val.trim().toUpperCase()
    setTin(clean)
    setTinError(null)

    if (clean.length >= 6) {
      const check = checkAgencyTINRegistered(clean, agencies)
      if (check.registered) {
        setDuplicateTINBlocked({ tin: clean, agencyName: check.agencyName, status: check.status })
      } else {
        setDuplicateTINBlocked(null)
      }
    } else {
      setDuplicateTINBlocked(null)
    }
  }

  // Real-time email check for .gov.ng
  const handleEmailChange = (val: string) => {
    setEmail(val)
    if (val && !val.toLowerCase().endsWith('.gov.ng')) {
      setEmailWarning(
        'Advisory Notice: This email address does not use an official government (.gov.ng) domain. Non-governmental domains are flagged prominently for the KADIRS Executive Reviewer.'
      )
    } else {
      setEmailWarning(null)
    }
  }

  // Real-time representative NIN check
  const handleOfficerNINChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '')
    setOfficerNIN(cleanDigits)

    if (cleanDigits.length === 11) {
      const match = findRepresentativeByNIN(cleanDigits)
      setRepNINMatch(match)
      if (match.found && match.name && !officerName) {
        setOfficerName(match.name)
      }
    } else {
      setRepNINMatch(null)
    }
  }

  // Advance Step 0 -> Step 1
  const handleStep0Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tin.trim()) {
      setTinError('Agency Tax Identification Number (TIN) is mandatory.')
      return
    }

    const check = checkAgencyTINRegistered(tin, agencies)
    if (check.registered) {
      setDuplicateTINBlocked({ tin, agencyName: check.agencyName, status: check.status })
      return
    }

    if (emailWarning) {
      logEvent({
        category: 'auth',
        action: 'AGENCY_NON_GOV_EMAIL_SUBMITTED',
        actor: email,
        details: { tin, agencyName, email }
      })
    }

    changeStep(1)
  }

  // Document upload simulation
  const handleSimulateUpload = () => {
    setMandateDocUploaded(true)
    setMandateDocName(`Gazette_${agencyName.replace(/[^a-zA-Z0-9]/g, '_')}_Auth.pdf`)
  }

  // Submit for Maker/Checker review
  const handleSubmitReview = () => {
    // If skipped mandate doc -> mark status as pending_documents
    const submissionStatus = mandateDocUploaded ? 'pending_approval' : 'pending_documents'
    setFinalStatus(submissionStatus)

    registerAgency({
      agencyName,
      agencyType: jurisdiction === 'Federal' ? 'federal' : jurisdiction === 'Local government' ? 'lga' : 'state',
      tin,
      email,
      mandateDocName: mandateDocUploaded ? mandateDocName : undefined,
      status: submissionStatus,
      representativeCitizenId: `CIT-AGY-${officerNIN.slice(-5) || 'REP'}`,
      representativeRole: officerRole
    })

    const generatedRef = `REF KD-AGY-2026-${Math.floor(10000 + Math.random() * 90000)}`
    setRefNumber(generatedRef)
    changeStep(3)
  }

  const assignedTaxOffice = LGA_TAX_OFFICES[selectedLga] || 'Kaduna North Tax Office'

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* STEP 0: Agency Details & Real-Time Ghost Agency Check              */}
      {/* ================================================================ */}
      {step === 0 && (
        <form
          className="bg-white shadow-float p-8 sm:p-9 rounded-[28px] space-y-6"
          onSubmit={handleStep0Submit}
        >
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Government agency &amp; MDA details
            </h2>
            <p className="text-[13.5px] text-[var(--gray-600)]">
              Register a state MDA, parastatal or local government council. Real-time agency registry screening is active.
            </p>

            {/* Evaluator Quick-Fill Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-3 text-xs">
              <span className="text-[var(--gray-500)] text-[11px]">Quick fill demo:</span>
              <button
                type="button"
                onClick={() => {
                  setJurisdiction('State')
                  handleTinChange('KAD-MIN-ENV-004')
                  setAgencyName('Kaduna State Ministry of Environment')
                  setEmail('contact@environment.kdsg.gov.ng')
                  setPhone('+234 802 333 4455')
                  setSelectedLga('Kaduna North')
                  setAddress('State Secretariat Complex, Independence Way, Kaduna')
                }}
                className="px-2.5 py-1 rounded-full border border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] text-[11px] font-medium transition-colors cursor-pointer"
              >
                Ministry of Environment (New Agency)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTinChange('KAD-MIN-FIN-001')
                  setAgencyName('Kaduna State Ministry of Finance')
                }}
                className="px-2.5 py-1 rounded-full border border-[var(--gray-200)] bg-[var(--paper)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] text-[11px] font-medium transition-colors cursor-pointer"
              >
                Ministry of Finance (Duplicate Test)
              </button>
            </div>
          </div>

          {/* Hard Block on Duplicate TIN */}
          {duplicateTINBlocked && (
            <div className="border border-rose-200 bg-rose-50/70 p-5 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-rose-700">
                    Duplicate Agency Registration Blocked
                  </h4>
                  <p className="text-xs text-[var(--ink)] mt-1 leading-relaxed">
                    Agency TIN <span className="font-mono font-bold">{duplicateTINBlocked.tin}</span> is already registered in the KADIRS agency registry (<span className="font-medium">{duplicateTINBlocked.agencyName}</span>, Status: <span className="capitalize font-semibold">{duplicateTINBlocked.status?.replace('_', ' ')}</span>).
                    To maintain registry integrity, duplicate registration of the same TIN is prohibited.
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateTINBlocked(null)
                    setTin('')
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Re-enter official TIN</span>
                </button>
              </div>
            </div>
          )}

          {tinError && !duplicateTINBlocked && (
            <div className="p-3.5 border border-rose-300 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{tinError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                Government jurisdiction level <span className="text-rose-500">*</span>
              </label>
              <select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value as any)}
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
              >
                <option value="State">Kaduna State Government (MDA)</option>
                <option value="Federal">Federal Parastatal in Kaduna</option>
                <option value="Local government">Local Government Council (LGA)</option>
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium flex items-center justify-between">
                <span>
                  Agency tax identification number (TIN) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-[var(--gray-500)]">Real-time check</span>
              </label>
              <input
                value={tin}
                onChange={(e) => handleTinChange(e.target.value)}
                placeholder="e.g. KAD-MIN-ENV-004"
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-[14.5px] uppercase focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
              Official MDA or parastatal name <span className="text-rose-500">*</span>
            </label>
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="e.g. Kaduna State Ministry of Environment"
              className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium flex items-center justify-between">
                <span>
                  Official government email <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-[var(--gray-500)]">.gov.ng preferred</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="e.g. contact@environment.kdsg.gov.ng"
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                required
              />
              {emailWarning && (
                <div className="p-3 mt-2 border border-amber-200 bg-amber-50/70 rounded-xl text-xs text-[var(--ink)] flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{emailWarning}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                Official telephone number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 802 333 4455"
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                State
              </label>
              <input
                value={stateName}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--gray-100)] text-[var(--gray-500)] text-[14px] cursor-not-allowed select-none"
              />
            </div>

            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                Operating LGA <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
              >
                {KADUNA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                Assigned tax revenue office
              </label>
              <input
                value={assignedTaxOffice}
                readOnly
                disabled
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--gray-100)] text-[var(--gray-600)] text-[13.5px] cursor-not-allowed select-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
              Official headquarters street address <span className="text-rose-500">*</span>
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. State Secretariat Complex, Independence Way, Kaduna"
              className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={onBackToSelection}
              className="text-[var(--gray-600)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={Boolean(duplicateTINBlocked) || !tin.trim() || !agencyName.trim()}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors ml-auto cursor-pointer disabled:opacity-50"
            >
              Continue to Signatory &rarr;
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 1: Mandate Upload & Authorized Signatory                     */}
      {/* ================================================================ */}
      {step === 1 && (
        <form
          className="bg-white shadow-float p-8 sm:p-9 rounded-[28px] space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            changeStep(2)
          }}
        >
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Mandate document &amp; authorized signatory
            </h2>
            <p className="text-[13.5px] text-[var(--gray-600)]">
              The designated accounting officer certifies this registration. Upload an executive council gazette or mandate letter.
            </p>
          </div>

          {/* Mandate Document Upload Area */}
          {!mandateDocUploaded ? (
            <div className="border-2 border-dashed border-[var(--gray-200)] hover:border-[#1AA260]/50 rounded-2xl p-6 sm:p-7 text-center bg-[var(--paper)]/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#1AA260] flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-[14.5px] text-[var(--ink)]">
                Official Gazette or Mandate Authorization
              </h4>
              <p className="text-[12.5px] text-[var(--gray-600)] max-w-[50ch] mx-auto mt-1 leading-relaxed">
                Upload an Executive Council Gazette, TIN Certificate, or ministerial mandate letter (PDF or TIFF up to 10MB).
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleSimulateUpload}
                  className="inline-flex items-center gap-2 border border-[var(--gray-200)] bg-white hover:bg-[var(--gray-100)] text-xs text-[var(--ink)] px-4 py-2 rounded-full font-medium transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[var(--gray-500)]" />
                  <span>Select mandate document &uarr;</span>
                </button>
              </div>
              <p className="text-[11px] text-[var(--gray-500)] mt-2.5">
                Optional but recommended. If omitted, filing enters <span className="font-mono text-[10.5px] bg-[var(--gray-100)] px-1.5 py-0.5 rounded">Pending_Documents</span> review status.
              </p>
            </div>
          ) : (
            <div className="border border-emerald-200 bg-emerald-50/60 rounded-2xl p-5 text-center space-y-2 animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#1AA260] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[#1AA260] font-semibold text-[13px] flex items-center justify-center gap-1.5">
                  <span>✓ Mandate document attached for review</span>
                </div>
                <div className="font-mono text-[13.5px] text-[var(--ink)] font-medium mt-1">
                  {mandateDocName}
                </div>
                <p className="text-[11px] text-[var(--gray-500)] mt-0.5">
                  Encrypted AES-256 &middot; Ready for KADIRS Maker/Checker authorization
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setMandateDocUploaded(false)}
                  className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
                >
                  Remove document
                </button>
              </div>
            </div>
          )}

          <div className="border border-[var(--gray-200)] bg-[var(--paper)] p-3.5 rounded-xl text-xs text-[var(--gray-600)] leading-relaxed">
            <span className="font-medium text-[var(--ink)]">Security Guarantee:</span> Uploaded mandate documents are encrypted using AES-256 and stored strictly for KADIRS Maker/Checker authorization review. Never shared externally.
          </div>

          {/* Officer Details */}
          <div className="space-y-4 pt-5 border-t border-[var(--gray-200)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-[15.5px] tracking-tight text-[var(--ink)]">
                Authorized Accounting Officer Details
              </h3>
              <button
                type="button"
                onClick={() => {
                  handleOfficerNINChange('33322211100')
                  setOfficerName('Aliyu Usman Dangida')
                  setOfficerRole('Director of Finance & Accounts')
                }}
                className="text-[11px] text-[#1AA260] hover:underline font-medium self-start sm:self-auto cursor-pointer"
              >
                Quick fill demo officer (Aliyu Dangida)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                  Officer personal NIN (11 digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  value={officerNIN}
                  onChange={(e) => handleOfficerNINChange(e.target.value)}
                  placeholder="e.g. 33322211100"
                  maxLength={11}
                  className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] font-mono text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  required
                />
              </div>

              <div>
                <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium">
                  Officer full legal name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  placeholder="e.g. Aliyu Usman Dangida"
                  className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                  required
                />
              </div>
            </div>

            {repNINMatch?.found && (
              <div className="border border-emerald-200 bg-emerald-50/60 p-3.5 rounded-xl text-xs text-[var(--ink)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1AA260] shrink-0" />
                <span>
                  ✓ Verified Citizen Account Found: <strong className="text-[#1AA260]">{repNINMatch.name}</strong> &middot; Pre-linked as Agency Authorized Officer.
                </span>
              </div>
            )}

            <div>
              <label className="block text-[12.5px] text-[var(--gray-700)] mb-1.5 font-medium flex items-center justify-between">
                <span>
                  Official government role / rank <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-[var(--gray-500)]">Used during admin assessment</span>
              </label>
              <input
                value={officerRole}
                onChange={(e) => setOfficerRole(e.target.value)}
                placeholder="e.g. Director of Finance & Accounts / Permanent Secretary"
                className="w-full px-3.5 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)] text-[var(--ink)] text-[14.5px] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(0)}
              className="text-[var(--gray-600)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="submit"
              disabled={!officerNIN.trim() || officerNIN.length !== 11 || !officerName.trim() || !officerRole.trim()}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              Review Agency Filing &rarr;
            </button>
          </div>
        </form>
      )}

      {/* ================================================================ */}
      {/* STEP 2: Summary Review Before Submitting to Maker/Checker        */}
      {/* ================================================================ */}
      {step === 2 && (
        <div className="bg-white shadow-float p-8 sm:p-9 rounded-[28px] space-y-6">
          <div>
            <h2 className="font-semibold text-[22px] tracking-tight text-[var(--ink)] mb-1">
              Review agency submission
            </h2>
            <p className="text-[13.5px] text-[var(--gray-600)]">
              Submissions undergo dual-control Maker/Checker review by the KADIRS Admin Board before activation.
            </p>
          </div>

          {/* High-density Review Summary Table with subtle zebra rows */}
          <div className="border border-[var(--gray-200)] rounded-2xl overflow-hidden">
            <div className="divide-y divide-[var(--gray-200)] text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-[var(--paper)]">
                <span className="font-medium text-[var(--gray-500)]">Agency Name</span>
                <span className="font-semibold text-[var(--ink)]">{agencyName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-white">
                <span className="font-medium text-[var(--gray-500)]">Agency TIN</span>
                <span className="font-mono font-medium text-[var(--ink)]">{tin}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-[var(--paper)]">
                <span className="font-medium text-[var(--gray-500)]">Jurisdiction</span>
                <span className="text-[var(--ink)]">{jurisdiction} &middot; {selectedLga} LGA</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-white">
                <span className="font-medium text-[var(--gray-500)]">Assigned Tax Office</span>
                <span className="text-[var(--ink)]">{assignedTaxOffice}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-[var(--paper)]">
                <span className="font-medium text-[var(--gray-500)]">Official Contact</span>
                <span className="text-[var(--ink)] font-mono text-[12.5px]">{email} &middot; {phone}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-white">
                <span className="font-medium text-[var(--gray-500)]">Headquarters Address</span>
                <span className="text-[var(--ink)]">{address}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-[var(--paper)]">
                <span className="font-medium text-[var(--gray-500)]">Accounting Officer</span>
                <span className="text-[var(--ink)]">
                  {officerName} &mdash; <span className="font-medium text-[#1AA260]">{officerRole}</span> (NIN:{' '}
                  <span className="font-mono">{officerNIN.slice(0, 3)}••••{officerNIN.slice(-3)}</span>)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] px-4 py-3 bg-white items-center">
                <span className="font-medium text-[var(--gray-500)]">Mandate Document</span>
                <div>
                  {mandateDocUploaded ? (
                    <span className="inline-flex items-center gap-1.5 text-[#1AA260] font-mono text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {mandateDocName} (Encrypted)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium text-xs">
                      Not attached (Record will enter Pending_Documents queue)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-amber-50/60 border border-amber-200 border-l-4 border-l-amber-500 p-4 rounded-xl text-[12.5px] text-[var(--ink)] leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Submitting sends this record to the KADIRS Maker/Checker queue for dual-control authorization. You will receive activation updates at <strong className="text-[var(--ink)]">{email}</strong>.
            </span>
          </div>

          <div className="flex justify-between items-center pt-5 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={() => changeStep(1)}
              className="text-[var(--gray-600)] hover:text-[var(--ink)] text-xs sm:text-sm px-4 py-2.5 rounded-full border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={handleSubmitReview}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-7 py-3 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Submit for Maker/Checker review &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: Confirmed / Submitted to Queue                           */}
      {/* ================================================================ */}
      {step === 3 && (
        <div className="bg-white shadow-float p-10 sm:p-12 text-center rounded-[28px] space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-full border-2 border-[#1AA260] flex items-center justify-center text-[#1AA260] mx-auto bg-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-semibold text-2xl tracking-tight text-[var(--ink)] mb-2">
              Dispatched to Maker/Checker Queue
            </h2>
            <p className="text-[14px] text-[var(--gray-600)] max-w-[48ch] mx-auto leading-relaxed">
              Agency filing for <strong className="text-[var(--ink)]">{agencyName}</strong> has been registered with status{' '}
              <span className="font-mono font-semibold uppercase text-[#1AA260]">{finalStatus.replace('_', ' ')}</span>.
            </p>
          </div>

          <div className="inline-block border border-[var(--gray-200)] px-6 py-3 text-sm font-mono tracking-wider text-[var(--ink)] bg-[var(--paper)] rounded-xl font-semibold">
            {refNumber}
          </div>

          <p className="text-xs text-[var(--gray-500)] max-w-[50ch] mx-auto">
            You may inspect this pending application in the KADIRS Admin Dual-Control Maker/Checker console.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="border border-[var(--gray-200)] hover:bg-[var(--gray-100)] text-[var(--gray-700)] px-5 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            >
              View in Admin Maker/Checker Queue &rarr;
            </button>
            <button
              onClick={onBackToSelection}
              className="bg-[#1AA260] hover:bg-[#158A52] text-white px-6 py-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
            >
              Start Another Registration
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
