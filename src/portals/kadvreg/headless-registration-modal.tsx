import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  X,
  Car,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useVehicleStore, type VehicleRecord } from '@/data/vehicle-store'
import { useEventLogger } from '@/engine/event-logger'
import { verifyNINWithNIMC } from '@/engine/kyc-simulator'
import { sendSimulatedOTP } from '@/engine/otp-simulator'

interface HeadlessRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (vehicle: VehicleRecord) => void
}

export function HeadlessRegistrationModal({
  isOpen,
  onClose,
  onSuccess
}: HeadlessRegistrationModalProps) {
  const navigate = useNavigate()
  const registerCitizen = useAuthEngine((s) => s.registerCitizen)
  const isNINRegistered = useAuthEngine((s) => s.isNINRegistered)
  const isEmailRegistered = useAuthEngine((s) => s.isEmailRegistered)
  const switchTspContext = useAuthEngine((s) => s.switchTspContext)
  const registerVehicleInStore = useVehicleStore((s) => s.registerVehicle)

  // Wizard Stage: 1 = Central Identity, 2 = KADVREG Vehicle Data, 3 = Post-Registration Education
  const [stage, setStage] = useState<1 | 2 | 3>(1)

  // Step 1: Central Identity Form State
  const [nin, setNin] = useState('10293847561') // Musa Garba's demo default
  const [isVerifyingNin, setIsVerifyingNin] = useState(false)
  const [ninVerified, setNinVerified] = useState(false)
  const [softPromptExisting, setSoftPromptExisting] = useState(false)
  const [ninData, setNinData] = useState<{
    legalName: string
    dateOfBirth: string
    gender: 'male' | 'female'
    photoUrl: string
  } | null>(null)

  // Phone & OTP
  const [phone, setPhone] = useState('+234 802 345 6789')
  const [otpSent, setOtpSent] = useState(false)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  // Account details
  const [email, setEmail] = useState('musa.garba@gmail.com')
  const [address, setAddress] = useState('14 Independence Way, Barnawa')
  const [lga, setLga] = useState('Kaduna South')
  const [taxOffice, setTaxOffice] = useState('Kaduna South Tax Office — Barnawa')
  const [password, setPassword] = useState('Kaduna2024!')
  const [showPassword, setShowPassword] = useState(false)

  // 3 Statutory Consents (Journey 2 requirement)
  const [consentAccuracy, setConsentAccuracy] = useState(false)
  const [consentNdpa, setConsentNdpa] = useState(false)
  const [consentUnified, setConsentUnified] = useState(false)

  // Errors & UI feedback
  const [step1Error, setStep1Error] = useState<string | null>(null)

  // Created Central Citizen ID
  const [createdCitizenId, setCreatedCitizenId] = useState<string | null>(null)

  // Step 2: KADVREG Tier 2 Vehicle Form State
  const [make, setMake] = useState('Honda')
  const [model, setModel] = useState('Accord 2.0T EX-L')
  const [year, setYear] = useState(2020)
  const [color, setColor] = useState('Crystal Black')
  const [vin, setVin] = useState('1HGCV1F18LA084920')
  const [engineNumber, setEngineNumber] = useState('K20C1-901842')
  const [category, setCategory] = useState<'private' | 'commercial' | 'government'>('private')
  const [pickupLga, setPickupLga] = useState('Kaduna South — Barnawa Zonal MLR')
  const [isSubmittingTier2, setIsSubmittingTier2] = useState(false)

  // Created Vehicle Record
  const [createdVehicle, setCreatedVehicle] = useState<VehicleRecord | null>(null)

  if (!isOpen) return null

  // Fast prefill for Musa Garba
  const handleLoadMusaPreset = () => {
    setNin('10293847561')
    setEmail('musa.garba@gmail.com')
    setPhone('+234 802 345 6789')
    setAddress('Plot 8, Katuru Road, Ungwan Sarki')
    setLga('Kaduna North')
    setTaxOffice('Kaduna North Tax Office — Kawo')
    setMake('Honda')
    setModel('Accord 2.0T EX-L')
    setYear(2020)
    setColor('Modern Steel Metallic')
    setVin('1HGCV1F18LA084920')
    setEngineNumber('K20C1-901842')
    setCategory('private')
  }

  // Verify NIN with Soft Prompt logic
  const handleVerifyNin = async () => {
    setStep1Error(null)
    const cleanNin = nin.replace(/\D/g, '')

    if (cleanNin.length !== 11) {
      setStep1Error('Please enter a valid 11-digit National Identity Number (NIN).')
      return
    }

    // Check soft prompt: if NIN exists in central pool, prompt softly instead of hard-blocking (Journey 2 rule)
    if (isNINRegistered(cleanNin)) {
      setSoftPromptExisting(true)
    } else {
      setSoftPromptExisting(false)
    }

    setIsVerifyingNin(true)
    try {
      const res = await verifyNINWithNIMC(cleanNin)
      setNinData({
        legalName: res.legalName,
        dateOfBirth: res.dateOfBirth,
        gender: res.gender,
        photoUrl: res.photoUrl
      })
      setNinVerified(true)
      // Send OTP to phone
      sendSimulatedOTP(phone, 'termii_sms_dnd')
      setOtpSent(true)
    } catch {
      setStep1Error('NIMC Identity verification service timed out. Please try again.')
    } finally {
      setIsVerifyingNin(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = () => {
    setOtpError(null)
    if (enteredOtp.trim() === '123456' || enteredOtp.trim().length === 6) {
      setOtpVerified(true)
    } else {
      setOtpError('Invalid 6-digit code. Use test code 123456.')
    }
  }

  // Submit Step 1: Central Identity Creation
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Error(null)

    if (!ninVerified || !ninData) {
      setStep1Error('Please complete NIN identity verification first.')
      return
    }

    if (!otpVerified) {
      setStep1Error('Please verify your phone number via 6-digit SMS code.')
      return
    }

    if (isEmailRegistered(email)) {
      setStep1Error('This email is already registered. Please provide an available email.')
      return
    }

    if (!consentAccuracy || !consentNdpa || !consentUnified) {
      setStep1Error('Please accept all 3 statutory NDPA declarations to proceed.')
      return
    }

    // Register citizen in central engine
    const profile = registerCitizen(
      {
        nin: nin.replace(/\D/g, ''),
        legalName: ninData.legalName,
        dateOfBirth: ninData.dateOfBirth,
        gender: ninData.gender,
        photoUrl: ninData.photoUrl,
        verificationProvider: 'nimc',
        verifiedAt: new Date().toISOString()
      },
      {
        email,
        phone,
        lga,
        taxOffice,
        address,
        personas: ['individual']
      }
    )

    setCreatedCitizenId(profile.citizenId)

    // Log headless token handoff
    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'HEADLESS_REGISTRATION_STEP1_COMPLETE',
      actor: profile.citizenId,
      tspId: 'kadvreg',
      details: {
        registrationSessionToken: 'issued_10min_single_use',
        referralTsp: 'kadvreg',
        tier1Status: 'COMPLETE',
        returnTo: '/kadvreg'
      }
    })

    // Advance to Step 2 (Tier 2 Vehicle Data) instantly inside KADVREG UI
    setStage(2)
  }

  // Submit Step 2: KADVREG Tier 2 Vehicle Questionnaire
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingTier2(true)

    const citizenId = createdCitizenId || 'CIT-KAD-2024-MUSA'
    const ownerName = ninData?.legalName || 'Musa Garba'

    // Generate plate number (e.g. KD-892-ZAR or KD-512-BNW)
    const randomDigits = Math.floor(100 + Math.random() * 900)
    const suffix = lga.includes('South') ? 'BNW' : 'ZAR'
    const plateNumber = `KD-${randomDigits}-${suffix}`

    const nextYear = new Date()
    nextYear.setFullYear(nextYear.getFullYear() + 1)
    const expiryDate = nextYear.toISOString().split('T')[0]

    const newVehicle = registerVehicleInStore({
      ownerCitizenId: citizenId,
      ownerName,
      plateNumber,
      vin: vin.trim().toUpperCase(),
      engineNumber: engineNumber.trim().toUpperCase(),
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      color: color.trim(),
      category,
      roadWorthinessExpiry: expiryDate,
      insuranceExpiry: expiryDate,
      hackneyPermit: category === 'commercial' ? `HACK-KD-${randomDigits}` : undefined,
      lgaAssigned: lga
    })

    setCreatedVehicle(newVehicle)

    // Log KADVREG Tier 2 completion
    useEventLogger.getState().logEvent({
      category: 'auth',
      action: 'KADVREG_TIER2_VEHICLE_REGISTERED',
      actor: citizenId,
      tspId: 'kadvreg',
      details: {
        plateNumber,
        vin: newVehicle.vin,
        make: newVehicle.make,
        model: newVehicle.model,
        category: newVehicle.category
      }
    })

    // Switch SSO context to KADVREG
    switchTspContext('kadvreg')

    setIsSubmittingTier2(false)
    // Advance to Stage 3 (Education Moment)
    setStage(3)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] shadow-xl overflow-hidden my-6">
        {/* KADVREG Embedded Modal Header */}
        <div className="bg-[#0F2D59] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-blue-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-semibold text-sm tracking-tight text-white">
                  KADVREG Motor Vehicle Administration
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/20">
                  Headless Registration
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80">
                Kaduna State Traffic &amp; Vehicle Licensing Authority &middot; Revmate TSP
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Modal"
            className="p-1 rounded-md text-blue-200 hover:text-white hover:bg-blue-800/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Stepper Banner */}
        <div className="bg-[var(--line-soft)]/50 border-b border-[var(--line)] px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                stage === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {stage > 1 ? '✓' : '1'}
            </span>
            <span className={`font-medium ${stage === 1 ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
              Central Identity Verification
            </span>
          </div>

          <span className="text-[var(--line)]">&rarr;</span>

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                stage === 2
                  ? 'bg-blue-600 text-white'
                  : stage === 3
                  ? 'bg-emerald-600 text-white'
                  : 'border border-[var(--line)] text-[var(--ink-soft)]'
              }`}
            >
              {stage === 3 ? '✓' : '2'}
            </span>
            <span className={`font-medium ${stage === 2 ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
              Tier 2 Vehicle Specification
            </span>
          </div>

          <span className="text-[var(--line)]">&rarr;</span>

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                stage === 3
                  ? 'bg-emerald-600 text-white'
                  : 'border border-[var(--line)] text-[var(--ink-soft)]'
              }`}
            >
              3
            </span>
            <span className={`font-medium ${stage === 3 ? 'text-[var(--green)]' : 'text-[var(--ink-soft)]'}`}>
              SSO Activation
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STAGE 1: Central Identity via NIN (Served inside KADVREG) */}
        {/* ======================================================== */}
        {stage === 1 && (
          <form onSubmit={handleStep1Submit} className="p-6 sm:p-7 space-y-5">
            {/* Header & Preset trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line-soft)] pb-3">
              <div>
                <h2 className="font-sans font-semibold text-[17px] sm:text-[19px] text-[var(--ink)] tracking-tight">
                  Step 1 of 2: Central Identity Verification
                </h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  Verify your citizen identity with NIMC to anchor your vehicle ownership record.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLoadMusaPreset}
                className="self-start text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded border border-blue-200 dark:border-blue-900/50"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>[⚡ Demo] Autofill Musa Garba</span>
              </button>
            </div>

            {/* Error Banner */}
            {step1Error && (
              <div className="p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[var(--radius)] text-xs text-[var(--danger)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Soft Prompt (Journey 2 Rule: Headless uses soft prompt, not hard block) */}
            {softPromptExisting && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius)] text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong className="block font-semibold">Account Discovered for this NIN</strong>
                    <span>
                      We found an existing Kaduna State citizen account for this NIN. You can sign in directly, or continue to bind your new vehicle.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Link
                    to="/auth/login"
                    className="text-xs font-semibold underline text-blue-700 dark:text-blue-400"
                  >
                    Log In with Password &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSoftPromptExisting(false)}
                    className="text-xs font-medium text-[var(--ink-soft)] hover:underline"
                  >
                    Dismiss &amp; Continue
                  </button>
                </div>
              </div>
            )}

            {/* NIN Input & Verification */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--ink-soft)] mb-1.5">
                National Identity Number (NIN) <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={11}
                  value={nin}
                  onChange={(e) => {
                    setNin(e.target.value)
                    setNinVerified(false)
                    setNinData(null)
                    setSoftPromptExisting(false)
                  }}
                  placeholder="Enter 11-digit NIN"
                  className="flex-1 px-3.5 py-2.5 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-sm font-mono focus:outline-2 focus:outline-blue-600"
                  required
                />
                <button
                  type="button"
                  onClick={handleVerifyNin}
                  disabled={isVerifyingNin || nin.replace(/\D/g, '').length !== 11}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2.5 rounded-[var(--radius)] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {isVerifyingNin ? 'Verifying...' : ninVerified ? 'Re-verify' : 'Verify NIMC'}
                </button>
              </div>
              <span className="text-[11px] text-[var(--ink-soft)] mt-1 block">
                NIN is validated via tokenised vNIN and never stored raw or transmitted to external TSPs.
              </span>
            </div>

            {/* NIMC Verified Data Summary */}
            {ninVerified && ninData && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-[var(--radius)] text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-[11.5px]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>NIMC Verified Identity Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[var(--ink)]">
                  <div>
                    <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Legal Name</span>
                    <span className="font-semibold text-xs">{ninData.legalName}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Date of Birth</span>
                    <span className="font-mono text-xs">{ninData.dateOfBirth}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Gender</span>
                    <span className="capitalize text-xs">{ninData.gender}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Phone & SMS OTP Challenge */}
            {ninVerified && (
              <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-[var(--ink)]">
                    SMS Security Challenge <span className="text-[var(--danger)]">*</span>
                  </label>
                  <span className="text-[11px] text-[var(--ink-soft)]">
                    Test Code: <strong className="font-mono text-emerald-600">123456</strong>
                  </span>
                </div>

                {!otpVerified ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit SMS code"
                        className="flex-1 px-3.5 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper-raised)] text-[var(--ink)] font-mono text-sm tracking-widest focus:outline-2 focus:outline-blue-600"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-[var(--radius)] transition-colors cursor-pointer"
                      >
                        Confirm Code
                      </button>
                    </div>
                    {otpError && <p className="text-[11px] text-[var(--danger)]">{otpError}</p>}
                    <p className="text-[10.5px] text-[var(--ink-soft)]">
                      Verification code {otpSent ? 'dispatched' : 'ready'} via Termii SMS (DND Route) to <strong className="font-mono text-[var(--ink)]">{phone}</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Phone number verified successfully (+234 802 ••• 6789)</span>
                  </div>
                )}
              </div>
            )}

            {/* Contact & Account Credentials Grid */}
            {otpVerified && (
              <div className="space-y-3 pt-1 border-t border-[var(--line-soft)] animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                      Official Email Address <span className="text-[var(--danger)]">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. musa.garba@gmail.com"
                      className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                      LGA of Residence <span className="text-[var(--danger)]">*</span>
                    </label>
                    <select
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                      required
                    >
                      <option value="Kaduna South">Kaduna South</option>
                      <option value="Kaduna North">Kaduna North</option>
                      <option value="Chikun">Chikun</option>
                      <option value="Zaria">Zaria</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                    Residential Address <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Plot 8, Katuru Road, Ungwan Sarki"
                    className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                    Create Unified Password <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600 pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10.5px] text-[var(--ink-soft)] mt-0.5 block">
                    Password powers both KADVREG and your unified Kaduna State citizen account.
                  </span>
                </div>

                {/* 3 Statutory Consent Checkboxes (Journey 2 Rule) */}
                <div className="p-3 bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-2.5">
                  <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[var(--ink-soft)] block">
                    Statutory Declarations &amp; NDPA Consent
                  </span>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentAccuracy}
                      onChange={(e) => setConsentAccuracy(e.target.checked)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <span className="text-[11.5px] text-[var(--ink)]">
                      I declare that all personal attributes and NIN details provided are true and correct.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentNdpa}
                      onChange={(e) => setConsentNdpa(e.target.checked)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <span className="text-[11.5px] text-[var(--ink)]">
                      I consent to KADIRS storing my encrypted identity record in accordance with NDPA 2023 regulations.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentUnified}
                      onChange={(e) => setConsentUnified(e.target.checked)}
                      className="mt-0.5 accent-blue-600"
                    />
                    <span className="text-[11.5px] text-[var(--ink)]">
                      <strong>Unified Identity Notice:</strong> I understand that registering on KADVREG creates a unified central KADIRS account that grants access to all connected Kaduna State digital services.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Row */}
            <div className="pt-2 flex items-center justify-between border-t border-[var(--line-soft)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-medium rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!otpVerified || !consentAccuracy || !consentNdpa || !consentUnified}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium px-5 py-2.5 rounded-[var(--radius)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Complete Identity &amp; Enter Vehicle Specs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STAGE 2: KADVREG Tier 2 Vehicle Questionnaire */}
        {/* ======================================================== */}
        {stage === 2 && (
          <form onSubmit={handleStep2Submit} className="p-6 sm:p-7 space-y-5">
            <div className="border-b border-[var(--line-soft)] pb-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Identity Linked: {ninData?.legalName || 'Musa Garba'}</span>
              </div>
              <h2 className="font-sans font-semibold text-[17px] sm:text-[19px] text-[var(--ink)] tracking-tight">
                Step 2 of 2: KADVREG Vehicle Technical Specifications
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Supply the technical data required by the Kaduna State Motor Licensing Authority to generate your plate allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Vehicle Make <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g. Honda, Toyota, Mercedes"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Model &amp; Trim <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Accord EX-L, Corolla"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Year of Manufacture <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="number"
                  min={1980}
                  max={2026}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Vehicle Body Color <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. Black, Silver, Navy"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Chassis / VIN Number (17 Chars) <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={17}
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="e.g. 1HGCV1F18LA084920"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs font-mono tracking-wider focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Engine Serial Number <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. K20C1-901842"
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs font-mono tracking-wider focus:outline-2 focus:outline-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Vehicle Classification <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                >
                  <option value="private">Private Saloon / SUV</option>
                  <option value="commercial">Commercial / Hackney Carriage</option>
                  <option value="government">Official / Parastatal Fleet</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--ink-soft)] mb-1">
                  Plate Pickup Zonal Station <span className="text-[var(--danger)]">*</span>
                </label>
                <select
                  value={pickupLga}
                  onChange={(e) => setPickupLga(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] text-[var(--ink)] text-xs focus:outline-2 focus:outline-blue-600"
                  required
                >
                  <option value="Kaduna South — Barnawa Zonal MLR">Kaduna South &mdash; Barnawa Zonal MLR</option>
                  <option value="Kaduna North — Kawo Zonal MLR">Kaduna North &mdash; Kawo Zonal MLR</option>
                  <option value="Zaria — PZ Zonal MLR">Zaria &mdash; PZ Zonal MLR</option>
                  <option value="Kafanchan Zonal MLR">Kafanchan Zonal MLR</option>
                </select>
              </div>
            </div>

            {/* Action Row */}
            <div className="pt-3 flex items-center justify-between border-t border-[var(--line-soft)]">
              <button
                type="button"
                onClick={() => setStage(1)}
                className="px-4 py-2 border border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)] hover:text-[var(--ink)] text-xs font-medium rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                &larr; Back to Step 1
              </button>

              <button
                type="submit"
                disabled={isSubmittingTier2}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-6 py-2.5 rounded-[var(--radius)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>{isSubmittingTier2 ? 'Allocating Plate...' : 'Issue License & Complete Registration'}</span>
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: Post-Registration Education Moment (Journey 2)  */}
        {/* ======================================================== */}
        {stage === 3 && createdVehicle && (
          <div className="p-7 sm:p-9 text-center space-y-5 animate-in fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600">
                Registration Successful
              </span>
              <h2 className="font-sans font-semibold text-[22px] sm:text-[24px] text-[var(--ink)] tracking-tight">
                You&apos;re Registered on KADVREG!
              </h2>
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                Your vehicle has been registered and assigned Kaduna State license plate{' '}
                <strong className="font-mono text-[var(--ink)] font-semibold">{createdVehicle.plateNumber}</strong>.
              </p>
            </div>

            {/* Dual Registration Education Card (Journey 2 requirement) */}
            <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-500/20 p-4 rounded-[var(--radius)] text-left max-w-lg mx-auto space-y-2.5">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>You also now have a unified PayKaduna account!</span>
              </div>
              <p className="text-[11.5px] text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                Through Kaduna State’s Auth 2.0 system, your single credentials (<strong className="font-mono">{email}</strong>) now unlock all 14 state services — including PayKaduna revenue payments and Personal Income Tax (PIT) — with zero extra registrations.
              </p>
            </div>

            {/* Quick Vehicle Summary */}
            <div className="bg-[var(--paper)] border border-[var(--line)] p-4 rounded-[var(--radius)] text-xs text-left max-w-lg mx-auto grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Vehicle</span>
                <span className="font-medium">{createdVehicle.year} {createdVehicle.make} {createdVehicle.model}</span>
              </div>
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Chassis / VIN</span>
                <span className="font-mono text-[11px]">{createdVehicle.vin}</span>
              </div>
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Assigned Station</span>
                <span className="font-medium">{createdVehicle.lgaAssigned}</span>
              </div>
              <div>
                <span className="text-[10.5px] uppercase font-semibold text-[var(--ink-soft)] block">Roadworthiness</span>
                <span className="text-emerald-600 font-medium">Valid until {createdVehicle.roadWorthinessExpiry}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onSuccess(createdVehicle)
                  onClose()
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-6 py-2.5 rounded-[var(--radius)] transition-colors cursor-pointer shadow-2xs"
              >
                <span>Continue to KADVREG Vehicle Dashboard &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose()
                  navigate('/paykaduna')
                }}
                className="w-full sm:w-auto border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--line-soft)] text-[var(--ink)] text-xs font-medium px-5 py-2.5 rounded-[var(--radius)] transition-colors cursor-pointer"
              >
                <span>Visit PayKaduna Central Hub</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
