import type { IdentityRecord, CitizenProfile, CorporateEntity, GovernmentAgency } from '../types'

export interface DemoPersonaConfig {
  id: string
  name: string
  tagline: string
  journey: string
  role: string
  identity: IdentityRecord
  profile: CitizenProfile
  corporate?: CorporateEntity
  agency?: GovernmentAgency
  description: string
  startingUrl: string
}

export const DEMO_PERSONAS: DemoPersonaConfig[] = [
  {
    id: 'fatima',
    name: 'Fatima Abdullahi',
    tagline: 'Hero Demo: Legacy User Unification & Single Authenticator',
    journey: 'Journey 3 (Existing User Unification)',
    role: 'Individual Citizen',
    identity: {
      nin: '12345678901',
      legalName: 'Fatima Aminu Abdullahi',
      dateOfBirth: '1989-07-14',
      gender: 'female',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-09-01T10:00:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-00847',
      email: 'fatimah.a@gmail.com',
      phone: '+234 803 123 4567',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
      address: '14 Swimming Pool Road, Kabala Doki, Kaduna',
      personas: ['individual'],
      profileCompleteness: 85,
      createdAt: '2024-09-01T10:00:00Z'
    },
    description: 'Holds accounts on PayKaduna, KADVREG, and PIT with different emails and slightly different name spellings. Proves silent pre-migration matching and Recognition Cards.',
    startingUrl: '/auth/login'
  },
  {
    id: 'amina',
    name: 'Amina Yusuf',
    tagline: 'New Citizen: NIN Onboarding via Central Portal',
    journey: 'Journey 1 (Individual New User via Portal)',
    role: 'Individual Citizen',
    identity: {
      nin: '77788899900',
      legalName: 'Amina Gambo Yusuf',
      dateOfBirth: '1995-11-23',
      gender: 'female',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-09-15T09:30:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-01992',
      email: 'amina.yusuf@outlook.com',
      phone: '+234 814 555 1212',
      lga: 'Kaduna South',
      taxOffice: 'Kaduna South Tax Office — Barnawa, Kaduna',
      address: '42 Constitution Road, Kaduna South',
      personas: ['individual'],
      profileCompleteness: 100,
      createdAt: '2024-09-15T09:30:00Z'
    },
    description: 'First-time tax registrant arriving at PayKaduna. Demonstrates 11-digit NIN verification, NIMC locked attributes, LGA tax office assignment, and 3 NDPA consent checkboxes.',
    startingUrl: '/auth/register'
  },
  {
    id: 'musa',
    name: 'Musa Ibrahim',
    tagline: 'TSP Direct: Headless Registration without Leaving KADVREG',
    journey: 'Journey 2 (Headless TSP Registration)',
    role: 'Individual Citizen',
    identity: {
      nin: '44455566677',
      legalName: 'Musa Bello Ibrahim',
      dateOfBirth: '1987-04-03',
      gender: 'male',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-09-10T14:15:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-03321',
      email: 'musa.i@gmail.com',
      phone: '+234 903 123 4567',
      lga: 'Chikun',
      taxOffice: 'Chikun Tax Office — Narayi Highcost, Kaduna',
      address: '8 Sabo Crescent, Television Garage, Kaduna',
      personas: ['individual'],
      profileCompleteness: 90,
      createdAt: '2024-09-10T14:15:00Z'
    },
    description: 'Arrives at KADVREG directly to register a car. Proves invisible modal handoff, soft prompt, Step 1 central identity + Step 2 Tier 2 vehicle data.',
    startingUrl: '/kadvreg'
  },
  {
    id: 'emeka',
    name: 'Emeka Obi',
    tagline: 'Progressive Profiling: Accessing PIT with Automatic Gap Analysis',
    journey: 'Journey 4 (Progressive Profiling)',
    role: 'Individual Citizen',
    identity: {
      nin: '98765432101',
      legalName: 'Emeka Chukwudi Obi',
      dateOfBirth: '1982-02-18',
      gender: 'male',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-08-20T11:00:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-00412',
      email: 'emeka.obi@yahoo.com',
      phone: '+234 706 123 4567',
      lga: 'Zaria',
      taxOffice: 'Zaria Central Tax Office — Sabon Gari, Zaria',
      address: '19 Market Road, Samaru, Zaria',
      personas: ['individual'],
      profileCompleteness: 65, // Incomplete for PIT (missing employment & TIN)
      createdAt: '2024-08-20T11:00:00Z'
    },
    description: 'Already has central PayKaduna access. When clicking Personal Income Tax (PIT), system runs instant gap analysis and prompts ONLY for delta fields (TIN + Employment).',
    startingUrl: '/paykaduna'
  },
  {
    id: 'amara',
    name: 'Amara Holdings Ltd',
    tagline: 'Corporate Entity: CAC Lookup & Authorized Representative Binding',
    journey: 'Journey 5 (Corporate Registration)',
    role: 'Corporate Representative',
    identity: {
      nin: '55566677788',
      legalName: 'Amara Chioma Nnamdi',
      dateOfBirth: '1984-10-09',
      gender: 'female',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-07-12T08:00:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-00109',
      email: 'amara.rep@amaraholdings.ng',
      phone: '+234 812 987 6543',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
      address: 'Plot 7 Ali Akilu Road, Kaduna',
      personas: ['individual', 'corporate'],
      profileCompleteness: 100,
      createdAt: '2024-07-12T08:00:00Z'
    },
    corporate: {
      rcNumber: 'RC-1849204',
      companyName: 'Amara Agro-Logistics Ltd',
      tin: '24098192-0001',
      status: 'active',
      industry: 'Transportation & Warehousing',
      directors: ['Amara Chioma Nnamdi', 'Chidi Kenneth Nnamdi'],
      representatives: ['CIT-KAD-2024-00109']
    },
    description: 'Proves CAC RC lookup, locked entity fields, representative NIN linking, and switching between personal citizen profile and corporate tax manager.',
    startingUrl: '/auth/register'
  },
  {
    id: 'aliyu',
    name: 'Kaduna State Ministry of Finance',
    tagline: 'Government Agency: Manual TIN & Maker/Checker Review',
    journey: 'Journey 6 (Government Agency)',
    role: 'Government Agency Officer (Director of Finance)',
    identity: {
      nin: '33322211100',
      legalName: 'Aliyu Usman Dangida',
      dateOfBirth: '1976-06-12',
      gender: 'male',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-08-01T10:00:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-00055',
      email: 'aliyu.dangida@kadunamof.gov.ng',
      phone: '+234 802 444 8899',
      lga: 'Kaduna North',
      taxOffice: 'Kaduna North Tax Office — Kawo, Kaduna',
      address: 'State Secretariat Complex, Independence Way, Kaduna',
      personas: ['agency'],
      profileCompleteness: 95,
      createdAt: '2024-08-01T10:00:00Z'
    },
    agency: {
      tin: 'KAD-MIN-FIN-001',
      agencyName: 'Kaduna State Ministry of Finance',
      agencyType: 'state',
      email: 'finance@kdsg.gov.ng',
      mandateDocName: 'KDSG_Executive_Council_Gazette_MoF_Auth.pdf',
      status: 'pending_approval',
      representativeCitizenId: 'CIT-KAD-2024-00055',
      representativeRole: 'Director of Finance & Accounts',
      submittedAt: '2024-09-18T16:30:00Z'
    },
    description: 'Submitted government agency registration. Locked in PENDING_APPROVAL state awaiting human Maker/Checker approval in the Admin console.',
    startingUrl: '/admin/dashboard'
  },
  {
    id: 'ibrahim',
    name: 'Ibrahim Danladi',
    tagline: 'Conflict Edge Case: Conflicting NIN Discrepancy & Dispute',
    journey: 'Reconciliation Conflict & Dispute Queue',
    role: 'Individual Citizen',
    identity: {
      nin: '11122233344',
      legalName: 'Ibrahim Dauda Danladi',
      dateOfBirth: '1991-03-27',
      gender: 'male',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      verificationProvider: 'nimc',
      verifiedAt: '2024-09-02T12:00:00Z'
    },
    profile: {
      citizenId: 'CIT-KAD-2024-00993',
      email: 'ibrahim.d@gmail.com',
      phone: '+234 805 123 4567',
      lga: 'Igabi',
      taxOffice: 'Igabi Tax Office — Turunku Road, Rigasa',
      address: 'Plot 3 Airport Road, Mando, Kaduna',
      personas: ['individual'],
      profileCompleteness: 80,
      createdAt: '2024-09-02T12:00:00Z'
    },
    description: 'Has conflicting NINs in legacy systems (PayKaduna vs KADVREG). Triggers conflict resolution and escalation to the KADIRS Admin dispute queue.',
    startingUrl: '/auth/login'
  }
]
