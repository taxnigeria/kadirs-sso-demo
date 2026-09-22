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
      setDeleteError('Type DELETE in all capitals to confirm statutory erasure.')
      return
    }
    if (!deletePassword) {
      setDeleteError('Your password is required to verify identity for erasure.')
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

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* BREADCRUMB NAVIGATION & RETURN TO PAYKADUNA HUB                           */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/paykaduna"
            className="text-[var(--ink-soft)] hover:text-[var(--green)] flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to PayKaduna</span>
          </Link>
          <span className="text-[var(--line)]">/</span>
          <span className="text-[var(--ink)] font-semibold">Profile Management &amp; NDPA Center</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--line-soft)] border border-[var(--line)] text-[var(--ink-soft)]">
            AAL2 Biometric Session
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PENDING NOTIFICATION BANNERS (24h Security Hold or 30-Day Erasure)        */}
      {/* ========================================================================= */}
      {pendingContactChange && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-[var(--radius)] text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-900">
                24-Hour Security Hold Active ({pendingContactChange.type.toUpperCase()})
              </strong>
              <span>
                A change to <code className="font-mono bg-amber-100 px-1 rounded">{pendingContactChange.newValue}</code> was initiated. Under NDPA fraud prevention rules, a 24-hour security window is active. An alert was dispatched to {pendingContactChange.oldValue}.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cancelContactChange}
              className="px-2.5 py-1.5 rounded border border-amber-300 bg-white hover:bg-amber-100 text-amber-900 font-semibold cursor-pointer transition-colors"
            >
              Cancel Hold
            </button>
            <button
              type="button"
              onClick={applyContactChangeImmediately}
              className="px-2.5 py-1.5 rounded bg-amber-700 hover:bg-amber-800 text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Presentation shortcut"
            >
              <Sparkles className="w-3 h-3" />
              <span>[⚡ Demo Fast-Track]</span>
            </button>
          </div>
        </div>
      )}

      {pendingDeletion && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-[var(--radius)] text-xs text-red-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-red-900">
                Statutory 30-Day Cooling-off Period Active (Right to Erasure)
              </strong>
              <span>
                An erasure request was logged under NDPA 2023 Sec. 36. Active PII is scheduled for permanent purge on{' '}
                <strong className="font-mono">{new Date(pendingDeletion.coolingPeriodExpiresAt).toLocaleDateString()}</strong>.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelAccountDeletion}
            className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-800 text-white font-semibold cursor-pointer transition-colors shrink-0"
          >
            Cancel Erasure &amp; Restore Account
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CITIZEN PROFILE HERO CARD                                                 */}
      {/* ========================================================================= */}
      <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Avatar & Identification */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full border-2 border-[var(--green)] overflow-hidden bg-[var(--line-soft)] shrink-0 flex items-center justify-center">
              {identity?.photoUrl ? (
                <img
                  src={identity.photoUrl}
                  alt={citizenName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ShieldCheck className="w-8 h-8 text-[var(--green)]" />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-[var(--green)] text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-tighter">
                NIMC
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans font-bold text-xl text-[var(--ink)] tracking-tight">
                  {citizenName}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20 px-2 py-0.5 rounded-[var(--radius)]">
                  <CheckCircle2 className="w-3 h-3" />
                  NIMC Verified (Assurance Level 2)
                </span>
              </div>
              <p className="text-xs text-[var(--ink-soft)] flex flex-wrap items-center gap-x-4 gap-y-0.5">
                <span>
                  Citizen ID: <strong className="font-mono text-[var(--ink)]">{citizenId}</strong>
                </span>
                <span>
                  Tax Jurisdiction:{' '}
                  <strong className="text-[var(--ink)]">{currentUser?.taxOffice || 'Kaduna North Tax Office'}</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Profile Completeness Meter */}
          <div className="w-full md:w-56 bg-[var(--paper)] p-3 rounded-[var(--radius)] border border-[var(--line)] text-xs space-y-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-[var(--ink-soft)] text-[11px] uppercase tracking-wider">
                Profile Completeness
              </span>
              <span className="font-mono text-[var(--green)]">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-[var(--line-soft)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--green)] transition-all duration-500 rounded-full"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <span className="text-[10px] text-[var(--ink-soft)] block">
              {completeness === 100
                ? '✓ All central & TSP profiles complete'
                : 'Supplemental fields needed for specific TSPs'}
            </span>
          </div>
        </div>

        {/* 6 Sub-Navigation Tabs */}
        <div className="flex items-center gap-1 mt-6 pt-4 border-t border-[var(--line-soft)] overflow-x-auto">
          {[
            { id: 'identity', label: 'Identity & Biometrics', icon: ShieldCheck },
            { id: 'contact', label: 'Contact Details (24h Hold)', icon: Phone },
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
                className={`px-3 py-2 rounded-[var(--radius)] text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? isDanger
                      ? 'bg-red-700 text-white font-semibold'
                      : 'bg-[var(--green)] text-white font-semibold'
                    : isDanger
                    ? 'text-red-700 hover:bg-red-50'
                    : 'text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: IDENTITY & BIOMETRICS (LOCKED LAYER 1)                             */}
      {/* ========================================================================= */}
      {activeTab === 'identity' && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line-soft)] pb-4">
            <div>
              <h2 className="font-sans font-semibold text-lg text-[var(--ink)] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--green)]" />
                <span>Layer 1: Immutable Identity Records (NIMC Verified)</span>
              </h2>
              <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                Cryptographically anchored to National Identity Management Commission biometric records.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2.5 py-1 rounded-[var(--radius)]">
              ✓ Hardware Key Locked
            </span>
          </div>

          {/* Statutory Explanatory Notice */}
          <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs text-[var(--ink-soft)] leading-relaxed flex items-start gap-3">
            <Info className="w-4 h-4 text-[var(--gold)] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[var(--ink)] block font-semibold mb-0.5">
                Immutable Biometric Master Anchor:
              </strong>
              Under Nigerian Data Protection Regulations and the KADIRS Identity Standard, personal identity records verified by NIMC cannot be altered through self-service. If your legal name or date of birth requires correction, formal modification must be executed at a designated NIMC biometric enrollment centre.
            </div>
          </div>

          {/* Read-Only Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>Legal Full Name</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                {identity?.legalName || 'Fatima Aminu Abdullahi'}
              </span>
              <span className="text-[10px] text-[var(--green)] font-medium">✓ NIMC Registry Verified</span>
            </div>

            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>National ID (NIN)</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-mono font-semibold text-[var(--ink)] block">
                {maskedNIN}
              </span>
              <span className="text-[10px] text-[var(--ink-soft)]">AES-256 Encrypted in HashiCorp Vault</span>
            </div>

            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>Date of Birth</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                {identity?.dateOfBirth || '1989-07-14'}
              </span>
              <span className="text-[10px] text-[var(--green)] font-medium">✓ Verified Age Proof</span>
            </div>

            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>Gender</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] capitalize block">
                {identity?.gender || 'Female'}
              </span>
              <span className="text-[10px] text-[var(--green)] font-medium">✓ NIMC Attribute</span>
            </div>

            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>Verification Authority</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-semibold text-[var(--ink)] block">
                NIMC Identity Server
              </span>
              <span className="text-[10px] text-[var(--ink-soft)]">Anchor ID: IDP-NIMC-KD</span>
            </div>

            <div className="bg-[var(--paper)] p-3.5 rounded-[var(--radius)] border border-[var(--line)] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[var(--ink-soft)] font-medium flex items-center justify-between">
                <span>Timestamp of Anchor</span>
                <Lock className="w-3 h-3 text-[var(--ink-soft)]" />
              </span>
              <span className="text-sm font-mono font-semibold text-[var(--ink)] block">
                {identity?.verifiedAt ? new Date(identity.verifiedAt).toLocaleDateString() : '01 Sep 2024'}
              </span>
              <span className="text-[10px] text-[var(--ink-soft)]">Audit Signature Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONTACT DETAILS (24-HOUR SECURITY WINDOW)                          */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-6">
          <div className="border-b border-[var(--line-soft)] pb-4">
            <h2 className="font-sans font-semibold text-lg text-[var(--ink)] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--green)]" />
              <span>Contact Attributes &amp; 24-Hour Security Hold Window</span>
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Manage your registered email and phone number under NDPA fraud prevention protocols.
            </p>
          </div>

          {/* Success / Error Feedback */}
          {contactSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{contactSuccessMsg}</span>
            </div>
          )}

          {contactErrorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{contactErrorMsg}</span>
            </div>
          )}

          {/* Current Contact Values Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-[var(--paper)] p-4 rounded-[var(--radius)] border border-[var(--line)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block">
                  Registered Email Address
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] block mt-0.5">
                  {currentUser?.email || 'N/A'}
                </span>
                <span className="text-[10px] text-[var(--green)] font-medium">✓ Primary Login Credential</span>
              </div>
              <Mail className="w-5 h-5 text-[var(--green)]" />
            </div>

            <div className="bg-[var(--paper)] p-4 rounded-[var(--radius)] border border-[var(--line)] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider block">
                  Registered Mobile Number
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] font-mono block mt-0.5">
                  {currentUser?.phone || 'N/A'}
                </span>
                <span className="text-[10px] text-[var(--green)] font-medium">✓ Primary 2FA Channel</span>
              </div>
              <Phone className="w-5 h-5 text-[var(--green)]" />
            </div>
          </div>

          {/* Contact Update Form */}
          <div className="pt-2 border-t border-[var(--line-soft)] space-y-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Request Contact Change (Invokes 24-Hour Security Window)
            </h3>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              To defend against SIM-swap attacks and unauthorized takeovers, any modification to your contact credentials invokes a mandatory <strong>24-hour security window</strong>. You must verify a one-time code on the new destination, while an instant cancellation notice is dispatched to your old contact.
            </p>

            {!contactOtpStep ? (
              <form onSubmit={handleInitiateContact} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label
                    className={`p-3 rounded-[var(--radius)] border flex items-center gap-2 cursor-pointer transition-all ${
                      contactType === 'email'
                        ? 'border-[var(--green)] bg-[var(--green)]/10 text-[var(--green)] font-semibold'
                        : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)]'
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
                    className={`p-3 rounded-[var(--radius)] border flex items-center gap-2 cursor-pointer transition-all ${
                      contactType === 'phone'
                        ? 'border-[var(--green)] bg-[var(--green)]/10 text-[var(--green)] font-semibold'
                        : 'border-[var(--line)] bg-[var(--paper)] text-[var(--ink-soft)]'
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
                    className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded-[var(--radius)] transition-colors cursor-pointer"
                >
                  Send Verification Code &rarr;
                </button>
              </form>
            ) : (
              <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] max-w-md space-y-3">
                <span className="text-xs font-bold text-[var(--ink)] block">
                  Verify New {contactType.toUpperCase()}
                </span>
                <p className="text-xs text-[var(--ink-soft)]">
                  Enter the 6-digit verification code dispatched to <code className="font-mono text-[var(--ink)]">{newContactValue}</code> (Demo OTP: <strong className="font-mono">123456</strong>).
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredContactOtp}
                  onChange={(e) => setEnteredContactOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 text-center tracking-widest font-mono text-sm font-bold border border-[var(--line)] rounded-[var(--radius)] bg-white"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyContactOtp}
                    className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded-[var(--radius)] cursor-pointer"
                  >
                    Confirm &amp; Place 24h Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => setContactOtpStep(false)}
                    className="px-3 py-2 border border-[var(--line)] text-xs text-[var(--ink-soft)] hover:bg-[var(--line-soft)] rounded-[var(--radius)] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ADDRESS & TAX OFFICE (AUTOMATIC REASSIGNMENT)                      */}
      {/* ========================================================================= */}
      {activeTab === 'address' && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-6">
          <div className="border-b border-[var(--line-soft)] pb-4">
            <h2 className="font-sans font-semibold text-lg text-[var(--ink)] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--green)]" />
              <span>Residency &amp; Automatic Tax Jurisdiction Reassignment</span>
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Kaduna State Revenue Law mandates taxation according to residency. Modifying your LGA automatically updates your assigned KADIRS Tax Office.
            </p>
          </div>

          {addressSavedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
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
                className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)]"
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
                className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)] font-medium"
              >
                {KADUNA_LGAS.map((lga) => (
                  <option key={lga} value={lga}>
                    {lga} LGA
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Tax Office Indicator */}
            <div className="p-4 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] text-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)] block">
                Designated KADIRS Tax Jurisdiction (Auto-Calculated)
              </span>
              <div className="text-sm font-semibold text-[var(--green)] flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>{dynamicAssignedTaxOffice}</span>
              </div>
              <span className="text-[10px] text-[var(--ink-soft)] block pt-1">
                All personal income tax assessments and direct revenue filings will be handled by this office.
              </span>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded-[var(--radius)] transition-colors cursor-pointer shadow-2xs"
            >
              Save Address &amp; Reassign Tax Jurisdiction
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DATA SHARING & NDPA CONSENT MANAGEMENT                             */}
      {/* ========================================================================= */}
      {activeTab === 'sharing' && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-6">
          <div className="border-b border-[var(--line-soft)] pb-4">
            <h2 className="font-sans font-semibold text-lg text-[var(--ink)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--green)]" />
              <span>NDPA 2023 Statutory Consent &amp; Data Sharing Center</span>
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Review and revoke authorization grants across connected state services in full compliance with the Nigeria Data Protection Act 2023.
            </p>
          </div>

          {revokedTspId && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-950 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Access Revoked:</strong> Consent for <code className="font-mono">{revokedTspId}</code> was withdrawn. An HMAC-SHA256 webhook was dispatched to purge local caches.
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
                  className={`p-4 rounded-[var(--radius)] border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    isConnected
                      ? 'border-[var(--line)] bg-[var(--paper)]'
                      : 'border-dashed border-[var(--line)] bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--ink)]">{tsp.name}</span>
                      <span className="text-[10px] font-mono uppercase bg-[var(--line-soft)] px-2 py-0.5 rounded text-[var(--ink-soft)]">
                        {tsp.id}
                      </span>
                      {isConnected ? (
                        <span className="text-[10px] font-semibold text-[var(--green)] bg-[var(--green)]/10 px-2 py-0.5 rounded border border-[var(--green)]/20">
                          ✓ Authorized
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--ink-soft)]">{tsp.desc}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="text-[var(--ink-soft)] font-medium">Consented Scopes:</span>
                      {tsp.scopes.map((s) => (
                        <code key={s} className="bg-white border border-[var(--line)] px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--ink)]">
                          {s}
                        </code>
                      ))}
                      <span className="text-slate-400">&middot;</span>
                      <span className="text-[10px] text-slate-500 font-medium">{tsp.consentedAt}</span>
                    </div>
                  </div>

                  <div>
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => handleRevokeConsent(tsp.id)}
                        className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-[var(--radius)] transition-colors cursor-pointer shrink-0"
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

      {/* ========================================================================= */}
      {/* TAB 5: SECURITY & SESSIONS (2FA & ACTIVE DEVICES)                         */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] rounded-[var(--radius)] p-6 space-y-6">
          <div className="border-b border-[var(--line-soft)] pb-4">
            <h2 className="font-sans font-semibold text-lg text-[var(--ink)] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--green)]" />
              <span>Authentication Credentials &amp; Active Device Sessions</span>
            </h2>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              Rotate passwords, configure multi-factor authentication, and monitor connected IP sessions.
            </p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Password successfully updated. Cryptographic hash recorded with Argon2id.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-[var(--radius)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Password Update Form */}
          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
              Change Account Password
            </h3>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[var(--line)] rounded-[var(--radius)] bg-[var(--paper)] focus:outline-hidden focus:border-[var(--green)]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[var(--green)] hover:bg-[var(--green-deep)] text-white text-xs font-semibold rounded-[var(--radius)] transition-colors cursor-pointer"
            >
              Update Password
            </button>
          </form>

          {/* Active Sessions Grid */}
          <div className="pt-4 border-t border-[var(--line-soft)] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
                  Active Sessions &amp; Network Attribution
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
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
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
                All secondary sessions have been revoked. Refresh tokens invalidated in Redis.
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-5 h-5 text-[var(--green)]" />
                  <div>
                    <strong className="text-[var(--ink)] block">Windows Desktop &mdash; Chrome Browser</strong>
                    <span className="text-[11px] text-[var(--ink-soft)]">
                      IP: <code className="font-mono">102.89.34.11</code> (Kaduna North, Nigeria) &middot; Active Current Session
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[var(--green)] bg-[var(--green)]/10 border border-[var(--green)]/20 px-2 py-0.5 rounded">
                  THIS DEVICE
                </span>
              </div>

              {!signedOutSessions && (
                <div className="p-3 bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[var(--ink-soft)]" />
                    <div>
                      <strong className="text-[var(--ink)] block">Samsung Galaxy S23 &mdash; PayKaduna Mobile</strong>
                      <span className="text-[11px] text-[var(--ink-soft)]">
                        IP: <code className="font-mono">105.112.44.82</code> (MTN Nigeria) &middot; Last active 3 hours ago
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Active Token</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DANGER ZONE (NDPA SEC. 36 RIGHT TO ERASURE)                        */}
      {/* ========================================================================= */}
      {activeTab === 'danger' && (
        <div className="bg-red-50/50 border border-red-200 rounded-[var(--radius)] p-6 space-y-6">
          <div className="border-b border-red-200 pb-4">
            <h2 className="font-sans font-semibold text-lg text-red-950 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-700" />
              <span>Danger Zone: NDPA Statutory Right to Erasure (Sec. 36)</span>
            </h2>
            <p className="text-xs text-red-800 mt-0.5">
              Exercise your legal right to delete personal identity data under the Nigeria Data Protection Act 2023.
            </p>
          </div>

          {/* Retention Category Explanation Cards */}
          <div className="space-y-3 text-xs">
            <span className="font-bold text-red-950 uppercase tracking-wider block">
              Statutory Three-Tier Data Retention Schedule:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded border border-red-200 space-y-1">
                <span className="text-[10.5px] font-bold text-red-700 uppercase block">
                  Category A &middot; Must Purge
                </span>
                <span className="font-semibold text-slate-900 block">Active PII &amp; Contact Records</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Upon completion of cooling period, name, phone, email, credentials, and biometrics link are deleted permanently.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-amber-200 space-y-1">
                <span className="text-[10.5px] font-bold text-amber-700 uppercase block">
                  Category B &middot; Statutory Audit
                </span>
                <span className="font-semibold text-slate-900 block">Consent &amp; Financial Ledger</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Consent records (indefinite under NDPA Sec. 24) and completed revenue payment receipts (2 years per Public Finance Law) must be retained.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded border border-slate-300 space-y-1">
                <span className="text-[10.5px] font-bold text-slate-700 uppercase block">
                  Category C &middot; Anonymized Reference
                </span>
                <span className="font-semibold text-slate-900 block">Anonymized Citizen ID Only</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Citizen ID (<code className="font-mono">CIT-KAD-...</code>) is preserved with all PII nulled to prevent dangling references in historical state receipts.
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <strong className="text-red-950 text-xs block font-semibold">
                Mandatory 30-Day Cooling-off Period:
              </strong>
              <span className="text-[11px] text-red-800">
                You can cancel deletion and restore your account at any time within 30 days of request.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-[var(--radius)] transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              Request Account Erasure &rarr;
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETION CONFIRMATION MODAL                                              */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-lg border border-red-300 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Statutory Account Erasure
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This initiates the statutory <strong>30-day cooling-off window</strong> under NDPA Section 36. Your account access across all 14 state TSPs will be locked.
            </p>

            {deleteError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
                {deleteError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason for Erasure Request:
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value="Personal privacy preference">Personal privacy preference (NDPA)</option>
                  <option value="Relocated outside Kaduna State">Relocated outside Kaduna State</option>
                  <option value="Account consolidation duplicate">Account consolidation / duplicate</option>
                  <option value="Other">Other statutory grounds</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Type <strong className="text-red-700">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-center font-bold text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Account Password *
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-2 border border-slate-300 text-xs font-semibold rounded hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccountDeletion}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded cursor-pointer transition-colors"
              >
                Confirm &amp; Begin 30-Day Cooling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
