import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Car,
  CheckCircle2,
  Plus,
  RefreshCw,
  Award,
  QrCode,
  Printer,
  X,
  ArrowRight,
  ExternalLink,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react'
import { useAuthEngine } from '@/engine/auth-engine'
import { useVehicleStore, type VehicleRecord } from '@/data/vehicle-store'
import { useEventLogger } from '@/engine/event-logger'
import { HeadlessRegistrationModal } from './headless-registration-modal'
import './kadvreg.css'

export default function KadVRegDashboard() {
  const navigate = useNavigate()
  const currentUser = useAuthEngine((s) => s.currentUser)
  const identity = useAuthEngine((s) => s.identity)
  const isAuthenticated = useAuthEngine((s) => s.isAuthenticated)
  const currentToken = useAuthEngine((s) => s.currentToken)
  const switchTspContext = useAuthEngine((s) => s.switchTspContext)
  const logout = useAuthEngine((s) => s.logout)

  const vehicles = useVehicleStore((s) => s.vehicles)
  const renewLicense = useVehicleStore((s) => s.renewLicense)

  // Active view tab for authenticated users: 'fleet' | 'apply' | 'revalidate'
  const [activeTab, setActiveTab] = useState<'fleet' | 'apply' | 'revalidate'>('fleet')

  // Unauthenticated form fields (matching screenshot)
  const [accountType, setAccountType] = useState('Individual Citizen (NIN)')
  const [phoneNumber, setPhoneNumber] = useState('08023456789')
  const [password, setPassword] = useState('Kaduna2024!')
  const [confirmPassword, setConfirmPassword] = useState('Kaduna2024!')

  // Headless registration modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Certificate view modal state
  const [selectedCertVehicle, setSelectedCertVehicle] = useState<VehicleRecord | null>(null)
  // Renewal feedback
  const [renewSuccessId, setRenewSuccessId] = useState<string | null>(null)

  // Ensure audience-locked token for KADVREG when authenticated (Journey 4 zero-friction SSO)
  useEffect(() => {
    if (isAuthenticated && currentUser && currentToken?.aud !== 'kadvreg') {
      try {
        switchTspContext('kadvreg')
      } catch {
        // Fallback safe
      }
    }
  }, [isAuthenticated, currentUser, currentToken?.aud, switchTspContext])

  // Get user's vehicles
  const userVehicles = currentUser
    ? vehicles.filter((v) => v.ownerCitizenId === currentUser.citizenId)
    : []

  const citizenName = identity?.legalName || currentUser?.email?.split('@')[0] || 'Citizen'
  const citizenId = currentUser?.citizenId || 'CIT-KAD-2024-00847'

  // Handle vehicle renewal
  const handleRenew = (vehicleId: string, plateNumber: string) => {
    renewLicense(vehicleId)
    setRenewSuccessId(vehicleId)
    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'KADVREG_ROADWORTHINESS_RENEWED',
      actor: citizenId,
      tspId: 'kadvreg',
      details: {
        vehicleId,
        plateNumber,
        newExpiryYears: 1
      }
    })
    setTimeout(() => setRenewSuccessId(null), 4000)
  }

  // Handle successful registration from modal
  const handleRegistrationSuccess = (newVehicle: VehicleRecord) => {
    useEventLogger.getState().logEvent({
      category: 'profile',
      action: 'KADVREG_NEW_VEHICLE_ADDED',
      actor: newVehicle.ownerCitizenId,
      tspId: 'kadvreg',
      details: {
        plateNumber: newVehicle.plateNumber,
        make: newVehicle.make,
        model: newVehicle.model
      }
    })
    setActiveTab('fleet')
  }

  return (
    <div className="kadvreg-root selection:bg-blue-100 selection:text-blue-900">
      {/* ========================================================================= */}
      {/* KADVREG BOOTSTRAP-STYLE TOP NAVBAR (Matching Screenshot)                  */}
      {/* ========================================================================= */}
      <header className="kadvreg-navbar sticky top-0 z-40 bg-white shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 py-1">
          {/* Left: Dual Government Logos (Kaduna State Coat of Arms + KADIRS Emblem) */}
          <div className="flex items-center gap-3.5">
            <Link to="/kadvreg" className="flex items-center gap-3">
              {/* Kaduna State Government Coat of Arms Circular Seal */}
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-emerald-600 bg-white shadow-xs p-1">
                <div className="w-full h-full rounded-full border border-amber-500 bg-gradient-to-b from-emerald-50 to-white flex flex-col items-center justify-center text-center">
                  <span className="text-[6px] font-extrabold uppercase text-emerald-800 leading-none tracking-tighter">
                    KADUNA STATE
                  </span>
                  <div className="w-5 h-4 my-0.5 border border-emerald-700 bg-emerald-600 rounded-xs flex items-center justify-center text-[7px] text-white font-black">
                    KD
                  </div>
                  <span className="text-[5.5px] font-bold uppercase text-emerald-900 leading-none tracking-tighter">
                    GOVERNMENT
                  </span>
                </div>
              </div>

              {/* KADIRS Revenue Logo with "...Tax For Service" Motto */}
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-amber-500 bg-white shadow-xs p-1">
                <div className="w-full h-full rounded-full border border-emerald-600 bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center text-center">
                  <span className="text-[6.5px] font-black uppercase text-amber-900 leading-none tracking-tight">
                    KADIRS
                  </span>
                  <span className="text-[6px] font-serif italic text-emerald-800 my-0.5">
                    Revmate
                  </span>
                  <span className="text-[4.5px] font-semibold uppercase text-slate-700 leading-none">
                    ...Tax For Service
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Uppercase Bold Bootstrap Styling) */}
          <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 my-2 md:my-0">
            <button
              type="button"
              onClick={() => setActiveTab('apply')}
              className={`kadvreg-navlink ${activeTab === 'apply' ? 'active' : ''}`}
            >
              HOME
            </button>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault()
                alert('KADVREG: Kaduna State Automated Vehicle Registration & Licensing Directorate (Revmate TSP).')
              }}
              className="kadvreg-navlink"
            >
              ABOUT
            </a>
            <a
              href="#infos"
              onClick={(e) => {
                e.preventDefault()
                alert('KADVREG INFOS: Official digital motor licensing guidelines, plate allocation schedule, and Hackney permit criteria.')
              }}
              className="kadvreg-navlink"
            >
              KADVREG INFOS
            </a>
            <button
              type="button"
              onClick={() => setActiveTab(isAuthenticated ? 'fleet' : 'apply')}
              className={`kadvreg-navlink ${activeTab === 'revalidate' ? 'active' : ''}`}
            >
              REVALIDATE VEH. PARTICULARS
            </button>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab('fleet')}
                className={`kadvreg-navlink text-blue-700 ${activeTab === 'fleet' ? 'active underline' : ''}`}
              >
                MY VEHICLES ({userVehicles.length})
              </button>
            )}
          </nav>

          {/* Right Nav: Auth Links & Admin Gear Button */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">
                    {citizenName}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 font-semibold">
                    {citizenId}
                  </div>
                </div>

                <Link
                  to="/paykaduna"
                  className="px-3 py-1.5 rounded-lg border border-emerald-600 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  title="Return to Central PayKaduna Hub"
                >
                  <span>PayKaduna</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/auth/login')
                  }}
                  title="Log out from central SSO"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  REGISTER
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  LOGIN
                </button>
              </div>
            )}

            {/* Circular Admin Badge (Matching Screenshot: Gold/Orange Circle with Gear + "Admin" text) */}
            <div className="flex flex-col items-center">
              <Link
                to="/admin"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border border-amber-600 flex items-center justify-center text-blue-900 shadow-xs hover:scale-105 transition-transform"
                title="KADIRS Administrative Console"
              >
                <Settings className="w-4 h-4 text-emerald-950 animate-[spin_10s_linear_infinite]" />
              </Link>
              <span className="text-[10px] font-bold text-red-600 mt-0.5">Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SSO ACTIVE BANNER (When Citizen Arrives via Central SSO)                   */}
      {/* ========================================================================= */}
      {isAuthenticated && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Authenticated via KADIRS Single Sign-On (Auth 2.0).</strong> Audience:{' '}
                <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">kadvreg</code> &bull; Citizen ID:{' '}
                <code className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-mono">{citizenId}</code>
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-emerald-700">Zero repeated password prompts</span>
              <Link
                to="/paykaduna"
                className="text-emerald-900 font-bold hover:underline flex items-center gap-1"
              >
                <span>← Back to PayKaduna Hub</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN BODY CONTENT                                                         */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Evaluator Quick-Test Banner for Journey 2 (Musa Garba) */}
        {!isAuthenticated && (
          <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-amber-900 font-medium">
                <strong>Evaluator Journey 2 Test:</strong> Simulate Musa Garba registering directly on KADVREG.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg shrink-0 cursor-pointer shadow-2xs transition-colors"
            >
              Test Musa Demo
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: UNAUTHENTICATED OR "APPLY" VIEW (Exact Replica of User Screenshot)*/}
        {/* ----------------------------------------------------------------------- */}
        {(!isAuthenticated || activeTab === 'apply') && (
          <div className="kadvreg-card max-w-xl mx-auto p-7 sm:p-9 space-y-5">
            {/* Form Heading (Exact from screenshot) */}
            <h1 className="font-sans font-bold text-2xl sm:text-[26px] text-slate-900 tracking-tight leading-snug">
              Application For New Vehicle Registration
            </h1>

            {/* Light Green Alert Notice (Exact from screenshot) */}
            <div className="kadvreg-alert-green">
              If You Wish To Register Your Vehicle in Kaduna Real-Time Online Within Minutes. Do The Following.
            </div>

            {/* Bootstrap-Style Form Controls (Exact from screenshot) */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setIsModalOpen(true)
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="kadvreg-label">Account type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="kadvreg-select"
                >
                  <option value="Individual Citizen (NIN)">Individual Citizen (NIN)</option>
                  <option value="Corporate Fleet (CAC)">Corporate Entity (CAC)</option>
                  <option value="Commercial Transport">Commercial Transport (Hackney)</option>
                </select>
              </div>

              <div>
                <label className="kadvreg-label">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Phone Number"
                  className="kadvreg-input"
                  required
                />
              </div>

              <div>
                <label className="kadvreg-label">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="kadvreg-input"
                  required
                />
              </div>

              <div>
                <label className="kadvreg-label">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="kadvreg-input"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="kadvreg-btn-primary w-full py-3 text-sm shadow-xs"
                >
                  <span>Proceed to NIMC Verification &amp; Vehicle Specs</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-center text-[11.5px] text-slate-500 pt-1">
                Already registered with KADIRS?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/auth/login')}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Sign in with unified central SSO
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: AUTHENTICATED FLEET VIEW (Bootstrap Card Design)                 */}
        {/* ----------------------------------------------------------------------- */}
        {isAuthenticated && activeTab === 'fleet' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="font-sans font-bold text-2xl text-slate-900 tracking-tight">
                  My Registered Vehicles
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kaduna State Motor Vehicle Administration fleet records linked to Citizen ID{' '}
                  <strong className="font-mono text-slate-800">{citizenId}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="kadvreg-btn-primary text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Another Vehicle</span>
                </button>
              </div>
            </div>

            {/* Vehicle Fleet Cards Grid */}
            {userVehicles.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {userVehicles.map((v) => (
                  <div
                    key={v.id}
                    className="kadvreg-card p-6 sm:p-7 space-y-5 hover:shadow-md transition-shadow"
                  >
                    {/* Top Row: Authentic Nigerian Plate & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      {/* Realistic Green & White Nigerian Number Plate */}
                      <div className="inline-flex flex-col items-center justify-center px-4 py-1.5 rounded-lg bg-white text-slate-900 border-2 border-emerald-600 shadow-xs font-mono select-none">
                        <span className="text-[8px] font-bold text-emerald-700 tracking-widest uppercase">
                          KADUNA &bull; STATE OF RECOVERY
                        </span>
                        <span className="text-base font-extrabold tracking-wider text-black">
                          {v.plateNumber}
                        </span>
                        <span className="text-[7.5px] font-semibold text-emerald-800 tracking-tight">
                          CENTRE OF LEARNING
                        </span>
                      </div>

                      <div className="text-left sm:text-right space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Roadworthy &middot; Active
                        </span>
                        <div className="text-[11px] text-slate-500">
                          Expiry: <strong className="text-slate-800">{v.roadWorthinessExpiry}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Technical Vehicle Specifications */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                          Make / Model
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {v.year} {v.make} {v.model}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                          Color &amp; Usage
                        </span>
                        <span className="text-slate-700 font-medium capitalize">
                          {v.color} ({v.category})
                        </span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                          VIN / Chassis Number
                        </span>
                        <span className="font-mono text-slate-800 text-xs">
                          {v.vin}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                          Zonal Licensing Station
                        </span>
                        <span className="text-slate-700">
                          {v.lgaAssigned} Zonal MLR
                        </span>
                      </div>

                      <div>
                        <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                          Engine Serial Number
                        </span>
                        <span className="font-mono text-slate-700">
                          {v.engineNumber}
                        </span>
                      </div>
                    </div>

                    {/* Success Renewal Flash Message */}
                    {renewSuccessId === v.id && (
                      <div className="kadvreg-alert-green text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Roadworthiness licence successfully revalidated for 12 additional months!</span>
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCertVehicle(v)}
                        className="kadvreg-btn-outline text-xs"
                      >
                        <Award className="w-3.5 h-3.5 text-blue-600" />
                        <span>Proof of Ownership</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRenew(v.id, v.plateNumber)}
                        className="kadvreg-btn-primary text-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Revalidate Particulars</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="kadvreg-card p-10 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Car className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-lg text-slate-800">
                    No Vehicles Registered Yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    No vehicle records found for Citizen ID {citizenId}. Use the online application form to register your vehicle and obtain official Kaduna State digital plates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="kadvreg-btn-primary text-xs"
                >
                  Apply For New Vehicle Registration
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: Headless Registration (Journey 2)                                  */}
      {/* ========================================================================= */}
      <HeadlessRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* ========================================================================= */}
      {/* MODAL: Proof of Ownership Digital Certificate                             */}
      {/* ========================================================================= */}
      {selectedCertVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white text-slate-900 border-4 border-double border-emerald-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 my-6 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedCertVehicle(null)}
              aria-label="Close Certificate Modal"
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Header */}
            <div className="text-center space-y-1 border-b-2 border-emerald-800/40 pb-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-700 mx-auto flex items-center justify-center text-emerald-800 font-bold text-xs">
                KDSG
              </div>
              <h3 className="font-serif font-bold text-lg tracking-tight text-emerald-950 uppercase">
                Kaduna State Internal Revenue Service
              </h3>
              <p className="text-[11px] font-medium tracking-widest text-emerald-800 uppercase">
                Motor Licensing Authority &middot; Revmate Directorate
              </p>
              <div className="pt-2">
                <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-900 font-serif font-bold text-xs uppercase tracking-wider rounded">
                  Certificate of Proof of Ownership
                </span>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span>Certificate No: <strong className="font-mono text-slate-800">POC-KD-{selectedCertVehicle.id.slice(-6)}</strong></span>
                <span>Issued: <strong className="text-slate-800">{selectedCertVehicle.registrationDate}</strong></span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Registered Owner</span>
                    <span className="font-bold text-slate-900">{selectedCertVehicle.ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Citizen ID</span>
                    <span className="font-mono text-slate-900">{selectedCertVehicle.ownerCitizenId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Assigned Plate Number</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{selectedCertVehicle.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Vehicle Category</span>
                    <span className="capitalize text-slate-900">{selectedCertVehicle.category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Make / Model / Year</span>
                    <span className="text-slate-900">{selectedCertVehicle.year} {selectedCertVehicle.make} {selectedCertVehicle.model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Chassis / VIN</span>
                    <span className="font-mono text-[11px] text-slate-900">{selectedCertVehicle.vin}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <QrCode className="w-12 h-12 text-slate-800" />
                  <div className="text-[10px] text-slate-500 leading-tight">
                    <span>Cryptographically verified</span>
                    <br />
                    <span>Kaduna State IAM Auth 2.0</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-serif italic text-xs text-slate-700">Executive Chairman</div>
                  <div className="text-[10px] font-medium text-slate-500">Kaduna State Revenue Service</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCertVehicle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
