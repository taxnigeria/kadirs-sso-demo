import { useState } from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Layers,
  KeyRound,
  Trash2,
  ArrowLeft,
  Sparkles,
  Smartphone,
  Laptop,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useEventLogger } from '@/engine/event-logger'
import { LGA_TAX_OFFICES, KADUNA_LGAS } from '@/data/lga-tax-offices'

type ProfileTab = 'identity' | 'contact' | 'address' | 'sharing' | 'security' | 'danger'

export default function ProfilePage() {
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const updateProfile = useAuthEngine((s) => s.updateProfile)
  const connectedTsps = useAuthEngine((s) => s.connectedTsps)
  const revokeTspConsent = useAuthEngine((s) => s.revokeTspConsent)
  const pendingContactChange = useAuthEngine((s) => s.pendingContactChange)
  const pendingDeletion = useAuthEngine((s) => s.pendingDeletion)
  const initiateContactChange = useAuthEngine((s) => s.initiateContactChange)
  const cancelContactChange = useAuthEngine((s) => s.cancelContactChange)
  const applyContactChangeImmediately = useAuthEngine((s) => s.applyContactChangeImmediately)
  const initiateAccountDeletion = useAuthEngine((s) => s.initiateAccountDeletion)
  const cancelAccountDeletion = useAuthEngine((s) => s.cancelAccountDeletion)

  const [activeTab, setActiveTab] = useState<ProfileTab>('identity')

  // Tab 2: Contact Form State
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [newContactValue, setNewContactValue] = useState('')
  const [contactOtpStep, setContactOtpStep] = useState(false)
  const [enteredContactOtp, setEnteredContactOtp] = useState('')
  const [contactSuccessMsg, setContactSuccessMsg] = useState<string | null>(null)
  const [contactErrorMsg, setContactErrorMsg] = useState<string | null>(null)

  // Tab 3: Address & LGA Form State
  const [addressInput, setAddressInput] = useState(
    currentUser?.address || '14 Swimming Pool Road, Kabala Doki, Kaduna'
  )
  const [selectedLga, setSelectedLga] = useState(currentUser?.lga || 'Kaduna North')
  const dynamicAssignedTaxOffice = LGA_TAX_OFFICES[selectedLga] || 'Kaduna North Tax Office'
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false)

  // Tab 4: Consent Revocation State
  const [revokedTspId, setRevokedTspId] = useState<string | null>(null)

  // Tab 5: Security / Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [signedOutSessions, setSignedOutSessions] = useState(false)

  // Tab 6: Deletion / Danger Zone State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteReason, setDeleteReason] = useState('Personal privacy preference')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Handlers for Contact Update (24h Security Window)
  const handleInitiateContact = (e: React.FormEvent) => {
    e.preventDefault()
    setContactErrorMsg(null)

    if (!newContactValue.trim()) {
      setContactErrorMsg(`Please enter a valid new ${contactType}.`)
      return
    }

    if (contactType === 'email' && !newContactValue.includes('@')) {
      setContactErrorMsg('Please enter a valid email address.')
      return
    }

    // Move to simulated OTP confirmation step
    setContactOtpStep(true)
  }

  const handleVerifyContactOtp = () => {
    if (enteredContactOtp !== '123456') {
      setContactErrorMsg('Invalid verification code. Enter demo OTP: 123456')
      return
    }

    initiateContactChange(contactType, newContactValue)
    setContactOtpStep(false)
    setNewContactValue('')
    setEnteredContactOtp('')
    setContactSuccessMsg(
      `24-Hour Security Hold Initiated: A hold has been placed on updating your ${contactType}. An alert has been dispatched to your existing contact.`
    )
    setTimeout(() => setContactSuccessMsg(null), 8000)
  }

  // Handlers for Address & Tax Office
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      address: addressInput,
      lga: selectedLga,
      taxOffice: dynamicAssignedTaxOffice
    })

    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'PROFILE_ADDRESS_AND_TAX_OFFICE_UPDATED',
      actor: currentUser?.citizenId || 'CITIZEN',
      details: {
        newLga: selectedLga,
        newTaxOffice: dynamicAssignedTaxOffice,
        newAddress: addressInput
      }
    })

    setAddressSavedSuccess(true)
    setTimeout(() => setAddressSavedSuccess(false), 5000)
  }

  // Handlers for Consent Revocation
  const handleRevokeConsent = (tspId: string) => {
    revokeTspConsent(tspId)
    setRevokedTspId(tspId)
    setTimeout(() => setRevokedTspId(null), 5000)
  }

  // Handlers for Security Password Change
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (!currentPassword) {
      setPasswordError('Current password is required.')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.')
      return
    }

    useEventLogger.getState().logEvent({
      category: 'security',
      action: 'PASSWORD_CHANGED',
      actor: currentUser?.citizenId || 'CITIZEN',
      details: {
        hashAlgorithm: 'Argon2id',
        timestamp: new Date().toISOString()
      }
    })

    setPasswordSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSuccess(false), 5000)
  }

  // Handlers for Account Erasure
  const handleConfirmAccountDeletion = () => {
    setDeleteError(null)
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE in all capital letters to confirm.')
      return
    }
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm it is really you.')
      return
    }

    initiateAccountDeletion(deleteReason)
    setIsDeleteModalOpen(false)
    setDeleteConfirmationText('')
    setDeletePassword('')
  }

  const citizenName = identity?.legalName || currentUser?.email?.split('@')[0] || 'Citizen'
  const citizenId = currentUser?.citizenId || 'CIT-KAD-2024-00847'
  const citizenNIN = identity?.nin || '12345678901'
  const maskedNIN = `${citizenNIN.slice(0, 3)}•••••${citizenNIN.slice(-3)}`
  const completeness = currentUser?.profileCompleteness || 85

  // Initials from name
  const initials = citizenName
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* ── Breadcrumb Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-4">
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/paykaduna"
            className="text-[var(--gray-500)] hover:text-[var(--ink)] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#1AA260]" />
            <span>Return to Dashboard</span>
          </Link>
          <span className="text-[var(--gray-300)]">/</span>
          <span className="text-[var(--ink)] font-semibold">Profile Management &amp; NDPA Privacy Center</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AAL2 Biometric Session</span>
          </span>
        </div>
      </div>

      {/* ── Pending Notification Banners (24h Security Hold or 30-Day Erasure) ── */}
      {pendingContactChange && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-[20px] text-xs text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200 dark:border-amber-800/60">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <strong className="font-semibold block text-amber-900 dark:text-amber-100 text-sm">
                24-Hour Security Hold Active ({pendingContactChange.type.toUpperCase()})
              </strong>
              <span className="text-[12px] text-amber-800 dark:text-amber-300 mt-0.5 block leading-relaxed">
                A change to <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">{pendingContactChange.newValue}</code> was initiated. Under NDPA fraud prevention rules, a 24-hour security window is active. An alert was dispatched to {pendingContactChange.oldValue}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cancelContactChange}
              className="px-4 py-2 rounded-full border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-950 hover:bg-amber-50 text-amber-900 dark:text-amber-200 font-semibold cursor-pointer transition-colors shadow-2xs text-xs"
            >
              Cancel Hold
            </button>
            <button
              type="button"
              onClick={applyContactChangeImmediately}
              className="px-4 py-2 rounded-full bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs text-xs"
              title="Presentation shortcut"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>[Demo Fast-Track]</span>
            </button>
          </div>
        </div>
      )}

      {pendingDeletion && (
        <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 rounded-[20px] text-xs text-rose-950 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200 dark:border-rose-800/60">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="font-semibold block text-rose-900 dark:text-rose-100 text-sm">
                Account Deletion in Progress (30-Day Grace Period)
              </strong>
              <span className="text-[12px] text-rose-800 dark:text-rose-300 mt-0.5 block leading-relaxed">
                Your request to close this account has been received. Your personal information is scheduled to be permanently erased on{' '}
                <strong className="font-mono text-rose-950 dark:text-rose-100">{new Date(pendingDeletion.coolingPeriodExpiresAt).toLocaleDateString()}</strong>. You can cancel this request at any time before then.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelAccountDeletion}
            className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer transition-colors shrink-0 shadow-xs text-xs"
          >
            Cancel Deletion &amp; Keep Account
          </button>
        </div>
      )}

      {/* ── Citizen Profile Hero Card ── */}
      <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Avatar & Identification */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-lg font-bold shrink-0 shadow-xs">
              {identity?.photoUrl ? (
                <img
                  src={identity.photoUrl}
                  alt={citizenName}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                initials
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display font-extrabold text-2xl text-[var(--ink)] tracking-tight leading-tight">
                  {citizenName}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#1AA260] border border-emerald-200 dark:border-emerald-800/50 px-3 py-0.5 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  NIMC Verified
                </span>
              </div>
              <p className="text-xs text-[var(--gray-500)] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span>Citizen ID: <strong className="font-mono text-[var(--ink)]">{citizenId}</strong></span>
                <span className="text-[var(--gray-300)]">&bull;</span>
                <span>NIN: <strong className="font-mono text-[var(--ink)]">{maskedNIN}</strong></span>
                <span className="text-[var(--gray-300)] hidden sm:inline">&bull;</span>
                <span className="hidden sm:inline">Tax Jurisdiction: <strong className="text-[var(--ink)]">{currentUser?.taxOffice || 'Kaduna North Tax Office'}</strong></span>
              </p>
            </div>
          </div>

          {/* Profile Completeness Meter */}
          <div className="w-full md:w-60 bg-[var(--paper)] p-4 rounded-2xl border border-[var(--gray-200)] text-xs space-y-2 shrink-0">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold">
                Profile Completeness
              </span>
              <span className="font-mono text-[#1AA260] font-bold text-sm">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--gray-200)] dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1AA260] transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[11px] text-[var(--gray-500)] block">
              {completeness === 100
                ? '✓ All central & TSP profiles complete'
                : 'Supplemental fields needed for specific TSPs'}
            </span>
          </div>
        </div>

        {/* 6 Sub-Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-6 pt-4 border-t border-[var(--gray-200)] overflow-x-auto">
          {[
            { id: 'identity', label: 'Identity', icon: ShieldCheck },
            { id: 'contact', label: 'Contact Details', icon: Phone },
            { id: 'address', label: 'Address & Tax Office', icon: MapPin },
            { id: 'sharing', label: 'Data Sharing & NDPA', icon: Layers },
            { id: 'security', label: 'Security & Sessions', icon: KeyRound },
            { id: 'danger', label: 'Danger Zone', icon: Trash2 }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDanger = tab.id === 'danger'

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? isDanger
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-[#1AA260] text-white shadow-xs'
                    : isDanger
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    : 'text-[var(--gray-500)] hover:text-[var(--ink)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── TAB 1: IDENTITY & BIOMETRICS (LOCKED LAYER 1) ── */}
      {activeTab === 'identity' && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--gray-200)] pb-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--ink)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#1AA260]" />
                <span>Layer 1: Immutable Identity Records (NIMC Verified)</span>
              </h2>
              <p className="text-xs text-[var(--gray-500)] mt-0.5">
                Cryptographically anchored to National Identity Management Commission biometric records.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1 rounded-full shadow-2xs">
              ✓ Hardware Key Locked
            </span>
          </div>

          {/* Statutory Explanatory Notice */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-[#1AA260] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink)] block font-semibold mb-0.5">
                Immutable Biometric Master Anchor:
              </strong>
              Under Nigerian Data Protection Regulations and the KADIRS Identity Standard, personal identity records verified by NIMC cannot be altered through self-service. If your legal name or date of birth requires correction, formal modification must be executed at a designated NIMC biometric enrollment centre.
            </div>
          </div>

          {/* Read-Only Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>Legal Full Name</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                {identity?.legalName || 'Fatima Aminu Abdullahi'}
              </span>
              <span className="text-[10.5px] text-[#1AA260] font-medium block">✓ NIMC Registry Verified</span>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>National ID (NIN)</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-mono font-semibold text-[var(--ink)] block">
                {maskedNIN}
              </span>
              <span className="text-[10.5px] text-[var(--gray-500)] block">AES-256 Encrypted in HashiCorp Vault</span>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>Date of Birth</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                {identity?.dateOfBirth || '1989-07-14'}
              </span>
              <span className="text-[10.5px] text-[#1AA260] font-medium block">✓ Verified Age Proof</span>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>Gender</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] capitalize block">
                {identity?.gender || 'Female'}
              </span>
              <span className="text-[10.5px] text-[#1AA260] font-medium block">✓ NIMC Attribute</span>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>Verification Authority</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                NIMC Identity Server
              </span>
              <span className="text-[10.5px] text-[var(--gray-500)] block">Anchor ID: IDP-NIMC-KD</span>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 space-y-1.5 shadow-2xs">
              <span className="text-[11px] uppercase tracking-wider text-[var(--gray-500)] font-bold flex items-center justify-between">
                <span>Timestamp of Anchor</span>
                <Lock className="w-3 h-3 text-[var(--gray-400)]" />
              </span>
              <span className="text-sm font-mono font-semibold text-[var(--ink)] block">
                {identity?.verifiedAt ? new Date(identity.verifiedAt).toLocaleDateString() : '01 Sep 2024'}
              </span>
              <span className="text-[10.5px] text-[var(--gray-500)] block">Audit Signature Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CONTACT DETAILS (24-HOUR SECURITY WINDOW) ── */}
      {activeTab === 'contact' && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[var(--gray-200)] pb-4">
            <h2 className="font-display font-bold text-lg text-[var(--ink)] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#1AA260]" />
              <span>Contact Attributes &amp; 24-Hour Security Hold Window</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Manage your registered email and phone number under NDPA fraud prevention protocols.
            </p>
          </div>

          {/* Success / Error Feedback */}
          {contactSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1AA260] shrink-0" />
              <span>{contactSuccessMsg}</span>
            </div>
          )}

          {contactErrorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{contactErrorMsg}</span>
            </div>
          )}

          {/* Current Contact Values Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4.5 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-[var(--gray-500)] uppercase tracking-wider block">
                  Registered Email Address
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] block mt-0.5">
                  {currentUser?.email || 'N/A'}
                </span>
                <span className="text-[10.5px] text-[#1AA260] font-medium block mt-0.5">✓ Primary Login Credential</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[var(--paper)]/60 dark:bg-white/[0.02] p-4.5 rounded-2xl border border-[var(--gray-200)] dark:border-white/5 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[11px] font-bold text-[var(--gray-500)] uppercase tracking-wider block">
                  Registered Mobile Number
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] font-mono block mt-0.5">
                  {currentUser?.phone || 'N/A'}
                </span>
                <span className="text-[10.5px] text-[#1AA260] font-medium block mt-0.5">✓ Primary 2FA Channel</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Contact Update Form */}
          <div className="pt-2 border-t border-[var(--gray-200)] dark:border-white/5 space-y-4">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Request Contact Change (Invokes 24-Hour Security Window)
            </h3>
            <p className="text-xs text-[var(--gray-500)] leading-relaxed">
              To defend against SIM-swap attacks and unauthorized takeovers, any modification to your contact credentials invokes a mandatory <strong>24-hour security window</strong>. You must verify a one-time code on the new destination, while an instant cancellation notice is dispatched to your old contact.
            </p>

            {!contactOtpStep ? (
              <form onSubmit={handleInitiateContact} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all ${
                      contactType === 'email'
                        ? 'border-[#1AA260] bg-emerald-50/50 dark:bg-emerald-950/30 text-[#1AA260] font-semibold'
                        : 'border-[var(--gray-200)] bg-[var(--paper)]/50 text-[var(--gray-600)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contactType"
                      checked={contactType === 'email'}
                      onChange={() => setContactType('email')}
                      className="sr-only"
                    />
                    <Mail className="w-4 h-4" />
                    <span>Update Email</span>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2 cursor-pointer transition-all ${
                      contactType === 'phone'
                        ? 'border-[#1AA260] bg-emerald-50/50 dark:bg-emerald-950/30 text-[#1AA260] font-semibold'
                        : 'border-[var(--gray-200)] bg-[var(--paper)]/50 text-[var(--gray-600)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contactType"
                      checked={contactType === 'phone'}
                      onChange={() => setContactType('phone')}
                      className="sr-only"
                    />
                    <Phone className="w-4 h-4" />
                    <span>Update Phone</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5">
                    New {contactType === 'email' ? 'Email Address' : 'Mobile Phone Number'} *
                  </label>
                  <input
                    type={contactType === 'email' ? 'email' : 'tel'}
                    value={newContactValue}
                    onChange={(e) => setNewContactValue(e.target.value)}
                    placeholder={
                      contactType === 'email'
                        ? 'e.g. fatimah.new@kaduna.gov.ng'
                        : 'e.g. +234 802 999 8877'
                    }
                    className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Send Verification Code &rarr;
                </button>
              </form>
            ) : (
              <div className="p-5 bg-[var(--paper)]/60 border border-[var(--gray-200)] rounded-2xl max-w-md space-y-3.5">
                <span className="text-xs font-bold text-[var(--ink)] block">
                  Verify New {contactType.toUpperCase()}
                </span>
                <p className="text-xs text-[var(--gray-500)] leading-relaxed">
                  Enter the 6-digit verification code dispatched to <code className="font-mono text-[var(--ink)] font-semibold">{newContactValue}</code> (Demo OTP: <strong className="font-mono text-[#1AA260]">123456</strong>).
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredContactOtp}
                  onChange={(e) => setEnteredContactOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 text-center tracking-widest font-mono text-base font-bold border border-[var(--gray-200)] rounded-full bg-[var(--card-bg)] text-[var(--ink)] focus:outline-none focus:border-[#1AA260]"
                />
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyContactOtp}
                    className="px-5 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-full cursor-pointer transition-all shadow-xs"
                  >
                    Confirm &amp; Place 24h Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOtpStep(false)}
                    className="px-4 py-2.5 border border-[var(--gray-200)] text-xs font-medium text-[var(--gray-600)] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] rounded-full cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: ADDRESS & TAX OFFICE (AUTOMATIC REASSIGNMENT) ── */}
      {activeTab === 'address' && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[var(--gray-200)] pb-4">
            <h2 className="font-display font-bold text-lg text-[var(--ink)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1AA260]" />
              <span>Residency &amp; Automatic Tax Jurisdiction Reassignment</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Kaduna State Revenue Law mandates taxation according to residency. Modifying your LGA automatically updates your assigned KADIRS Tax Office.
            </p>
          </div>

          {addressSavedSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1AA260] shrink-0" />
              <span>
                <strong>Tax Office Reassigned:</strong> Your residential jurisdiction and assigned office have been updated in the state central database.
              </span>
            </div>
          )}

          <form onSubmit={handleSaveAddress} className="space-y-5 max-w-xl">
            {/* Street Address */}
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5">
                Residential Street Address *
              </label>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-xl bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
                required
              />
            </div>

            {/* LGA Selector (23 LGAs) */}
            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1.5">
                Local Government Area (LGA) *
              </label>
              <select
                value={selectedLga}
                onChange={(e) => setSelectedLga(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-xl bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] font-medium cursor-pointer shadow-xs"
              >
                {KADUNA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga} LGA
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Tax Office Indicator */}
            <div className="p-4 bg-[var(--paper)]/60 border border-[var(--gray-200)] rounded-2xl text-xs space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gray-500)] block">
                Designated KADIRS Tax Jurisdiction (Auto-Calculated)
              </span>
              <div className="text-sm font-semibold text-[#1AA260] flex items-center gap-2 pt-0.5">
                <Building2 className="w-4 h-4" />
                <span>{dynamicAssignedTaxOffice}</span>
              </div>
              <span className="text-[10.5px] text-[var(--gray-500)] block pt-1 leading-relaxed">
                All personal income tax assessments and direct revenue filings will be handled by this office.
              </span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs"
            >
              Save Address &amp; Reassign Tax Jurisdiction
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 4: DATA SHARING & NDPA CONSENT MANAGEMENT ── */}
      {activeTab === 'sharing' && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[var(--gray-200)] pb-4">
            <h2 className="font-display font-bold text-lg text-[var(--ink)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1AA260]" />
              <span>NDPA 2023 Statutory Consent &amp; Data Sharing Center</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Review and revoke authorization grants across connected state services in full compliance with the Nigeria Data Protection Act 2023.
            </p>
          </div>

          {revokedTspId && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-200 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Access Revoked:</strong> Consent for <code className="font-mono font-bold">{revokedTspId}</code> was withdrawn. An HMAC-SHA256 webhook was dispatched to purge local caches.
              </span>
            </div>
          )}

          <div className="space-y-4">
            {[
              {
                id: 'paykaduna',
                name: 'PayKaduna Revenue Portal',
                category: 'Central Citizen Revenue Portal',
                scopes: ['profile:read', 'services:access', 'receipts:view'],
                consentedAt: '15 Sep 2024 (Consent Event 1)',
                desc: 'Primary state revenue collection gateway for rates, levies, and land administration.'
              },
              {
                id: 'kadvreg',
                name: 'KADVREG Vehicle Licensing',
                category: 'Kaduna State Motor Vehicle Administration',
                scopes: ['profile:read', 'vehicles:fleet', 'licence:renew'],
                consentedAt: '22 Sep 2024 (Consent Event 1 & 2)',
                desc: 'Motor licensing, roadworthiness renewals, digital plate allocations.'
              },
              {
                id: 'pit',
                name: 'PIT Personal Income Tax Portal',
                category: 'Directorate of Personal Income Tax',
                scopes: ['profile:read', 'tax:assess', 'tin:view', 'tcc:generate'],
                consentedAt: '22 Sep 2024 (Consent Event 2)',
                desc: 'Direct tax assessment, employer PAYE reconciliation, and digital Tax Clearance Certificates.'
              }
            ].map((tsp) => {
              const isConnected = connectedTsps.includes(tsp.id)

              return (
                <div
                  key={tsp.id}
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    isConnected
                      ? 'border-[var(--gray-200)] bg-[var(--paper)]/50'
                      : 'border-dashed border-[var(--gray-200)] bg-slate-50/50 dark:bg-white/[0.01] opacity-60'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--ink)]">{tsp.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-[var(--gray-100)] dark:bg-white/10 px-2 py-0.5 rounded-full text-[var(--gray-600)] dark:text-[var(--gray-300)]">
                        {tsp.id}
                      </span>
                      {isConnected ? (
                        <span className="text-[10.5px] font-semibold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                          ✓ Authorized
                        </span>
                      ) : (
                        <span className="text-[10.5px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">{tsp.desc}</p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <span className="text-[var(--gray-500)] font-medium">Consented Scopes:</span>
                      {tsp.scopes.map((s) => (
                        <code key={s} className="bg-[var(--card-bg)] border border-[var(--gray-200)] px-2 py-0.5 rounded-full text-[10px] font-mono text-[var(--ink)]">
                          {s}
                        </code>
                      ))}
                      <span className="text-[var(--gray-300)]">&middot;</span>
                      <span className="text-[10.5px] text-[var(--gray-500)] font-medium">{tsp.consentedAt}</span>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeConsent(tsp.id)}
                        className="px-4 py-1.5 border border-rose-300 dark:border-rose-800/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold rounded-full transition-colors cursor-pointer shrink-0 shadow-2xs"
                      >
                        Revoke Consent
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">Access Suspended</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: SECURITY & SESSIONS (2FA & ACTIVE DEVICES) ── */}
      {activeTab === 'security' && (
        <div className="bg-[var(--card-bg)] text-[var(--ink)] border border-[var(--gray-200)] shadow-sm rounded-[24px] p-6 sm:p-7 space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-[var(--gray-200)] pb-4">
            <h2 className="font-display font-bold text-lg text-[var(--ink)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#1AA260]" />
              <span>Authentication Credentials &amp; Active Device Sessions</span>
            </h2>
            <p className="text-xs text-[var(--gray-500)] mt-0.5">
              Rotate passwords, configure multi-factor authentication, and monitor connected IP sessions.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1AA260] shrink-0" />
              <span>Password successfully updated. Cryptographic hash recorded with Argon2id.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Password Update Form */}
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <h3 className="font-display font-bold text-sm text-[var(--ink)]">
              Change Account Password
            </h3>

            <div>
              <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--ink)] block mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] focus:outline-none focus:border-[#1AA260] focus:ring-2 focus:ring-[#1AA260]/10 transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1AA260] hover:bg-[#158A52] text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs"
            >
              Update Password
            </button>
          </form>

          {/* Active Sessions Grid */}
          <div className="pt-4 border-t border-[var(--gray-200)] dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[var(--ink)]">
                  Active Sessions &amp; Network Attribution
                </h3>
                <p className="text-xs text-[var(--gray-500)] mt-0.5">
                  Devices authenticated through OAuth 2.0 PKCE with active refresh tokens.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSignedOutSessions(true)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                Sign Out All Other Sessions
              </button>
            </div>

            {signedOutSessions && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs rounded-2xl">
                All secondary sessions have been revoked. Refresh tokens invalidated in Redis.
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div className="p-3.5 bg-[var(--paper)]/60 dark:bg-white/[0.02] border border-[var(--gray-200)] dark:border-white/5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1AA260]/10 text-[#1AA260] flex items-center justify-center shrink-0">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-[var(--ink)] block font-semibold">Windows Desktop &mdash; Chrome Browser</strong>
                    <span className="text-[11px] text-[var(--gray-500)]">
                      IP: <code className="font-mono text-[var(--ink)]">102.89.34.11</code> (Kaduna North, Nigeria) &middot; Active Current Session
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#1AA260] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full">
                  THIS DEVICE
                </span>
              </div>

              {!signedOutSessions && (
                <div className="p-3.5 bg-[var(--paper)]/60 dark:bg-white/[0.02] border border-[var(--gray-200)] dark:border-white/5 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/10 text-[var(--gray-600)] flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-[var(--ink)] block font-semibold">Samsung Galaxy S23 &mdash; PayKaduna Mobile</strong>
                      <span className="text-[11px] text-[var(--gray-500)]">
                        IP: <code className="font-mono text-[var(--ink)]">105.112.44.82</code> (MTN Nigeria) &middot; Last active 3 hours ago
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    Active Token
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: DANGER ZONE (ACCOUNT DELETION & DATA ERASURE) ── */}
      {activeTab === 'danger' && (
        <div className="bg-rose-50/40 dark:bg-rose-950/15 border border-rose-200/80 dark:border-rose-900/40 rounded-[24px] p-6 sm:p-7 space-y-6 shadow-sm animate-in fade-in duration-200">
          <div className="border-b border-rose-200 dark:border-rose-900/40 pb-4">
            <h2 className="font-display font-bold text-lg text-rose-950 dark:text-rose-200 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Danger Zone: Delete Your Account &amp; Personal Data</span>
            </h2>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
              Permanently close your Kaduna State unified account and remove your personal identity records under NDPA 2023 guidelines.
            </p>
          </div>

          {/* Retention Category Explanation Cards */}
          <div className="space-y-3 text-xs">
            <span className="font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider block text-[11px]">
              What happens to your information when you delete your account:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="bg-[var(--card-bg)] text-[var(--ink)] p-4 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 space-y-1.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400 uppercase block">
                  1. Permanently Deleted
                </span>
                <span className="font-semibold text-[var(--ink)] block text-sm">Personal &amp; Contact Details</span>
                <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">
                  After the 30-day grace period, your name, phone number, email address, password, and linked NIN are completely erased from our servers.
                </p>
              </div>

              <div className="bg-[var(--card-bg)] text-[var(--ink)] p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase block">
                  2. Kept by Law for Audits
                </span>
                <span className="font-semibold text-[var(--ink)] block text-sm">Past Payments &amp; Consent</span>
                <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">
                  Official receipts for past tax and revenue payments (kept for 2 years) and records of permissions you previously granted must be preserved for government auditing.
                </p>
              </div>

              <div className="bg-[var(--card-bg)] text-[var(--ink)] p-4 rounded-2xl border border-[var(--gray-200)] space-y-1.5 shadow-2xs">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase block">
                  3. De-Identified ID Number
                </span>
                <span className="font-semibold text-[var(--ink)] block text-sm">Anonymous System ID</span>
                <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">
                  Your ID number (<code className="font-mono text-[var(--ink)]">CIT-KAD-...</code>) is kept without any name or contact info attached, so previous state revenue receipts remain valid without pointing to you.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className="text-rose-950 dark:text-rose-300 text-xs block font-semibold">
                30-Day Grace Period:
              </strong>
              <span className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                Changed your mind? You can log in and restore your account at any time within 30 days of your request.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full transition-all cursor-pointer shrink-0 shadow-xs"
            >
              Delete My Account &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ── Deletion Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--card-bg)] text-[var(--ink)] rounded-[26px] border border-rose-300 dark:border-rose-900/60 p-6 sm:p-7 space-y-4 shadow-float animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] font-display">
                Are you sure you want to delete your account?
              </h3>
            </div>

            <p className="text-xs text-[var(--gray-600)] dark:text-[var(--gray-400)] leading-relaxed">
              This starts a <strong>30-day grace period</strong> before permanent deletion. During this time, your logins to PayKaduna, KADVREG, PIT, and all other state services will be paused. If you don't cancel within 30 days, your account and personal details will be permanently removed.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs rounded-2xl font-medium">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  Why are you deleting your account?
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-xl bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] text-xs cursor-pointer focus:outline-none focus:border-rose-500"
                >
                  <option value="Personal privacy preference">I want to remove my personal data (Privacy preference)</option>
                  <option value="Relocated outside Kaduna State">I moved outside Kaduna State</option>
                  <option value="Account consolidation duplicate">I have another account / duplicate account</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  Type <strong className="text-rose-600 dark:text-rose-400">DELETE</strong> in capital letters to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] font-mono text-center font-bold text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  Enter Your Password:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 border border-[var(--gray-200)] rounded-full bg-[var(--paper)]/50 dark:bg-white/[0.03] text-[var(--ink)] text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--gray-200)]">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-[var(--gray-200)] text-xs font-semibold rounded-full hover:bg-black/[0.03] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccountDeletion}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-full cursor-pointer transition-all shadow-xs"
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
