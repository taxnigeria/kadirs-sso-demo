import type { LegacyTspRecord } from '../types'

// Deliberately messy legacy database for PayKaduna
export const PAYKADUNA_LEGACY_RECORDS: LegacyTspRecord[] = [
  {
    id: 'pk-rec-101',
    tspId: 'paykaduna',
    name: 'Fatima A. Abdullahi',
    email: 'fatimah.a@gmail.com',
    phone: '08031234567',
    nin: '12345678901',
    lastActivity: 'Paid ₦15,000 vehicle registration fee',
    lastActivityDate: '2024-03-14',
    accountCreated: '2023-08-11'
  },
  {
    id: 'pk-rec-102',
    tspId: 'paykaduna',
    name: 'Emeka Obi',
    email: 'emeka.obi@yahoo.com',
    phone: '07061234567',
    nin: '98765432101',
    lastActivity: 'Paid ₦5,000 Kaduna municipal business levy',
    lastActivityDate: '2024-01-22',
    accountCreated: '2022-11-05'
  },
  {
    id: 'pk-rec-103',
    tspId: 'paykaduna',
    name: 'Ibrahim D. Danladi',
    email: 'ibrahim.d@gmail.com',
    phone: '08051234567',
    nin: '11122233344',
    lastActivity: 'Paid ₦3,500 state signage fee',
    lastActivityDate: '2024-06-18',
    accountCreated: '2023-02-14'
  },
  {
    id: 'pk-rec-104',
    tspId: 'paykaduna',
    name: 'Amara Nnamdi',
    email: 'amara.personal@gmail.com',
    phone: '08129876543',
    nin: '55566677788',
    lastActivity: 'Paid personal property development fee',
    lastActivityDate: '2024-05-02',
    accountCreated: '2023-10-19'
  }
]

// Deliberately messy legacy database for KADVREG Vehicle Registration
export const KADVREG_LEGACY_RECORDS: LegacyTspRecord[] = [
  {
    id: 'kadv-rec-201',
    tspId: 'kadvreg',
    name: 'Fatimah Abdullahi', // Name spelling difference ("Fatimah" vs "Fatima A.")
    email: 'fatima.abdullahi@yahoo.com', // Different email domain
    phone: '08031234568', // One digit off (08031234568 vs 08031234567)
    // No NIN on KADVREG!
    lastActivity: 'Registered Toyota Corolla (Plate: KD-123-ABC)',
    lastActivityDate: '2024-02-28',
    accountCreated: '2023-04-10'
  },
  {
    id: 'kadv-rec-202',
    tspId: 'kadvreg',
    name: 'Ibrahim Danladi',
    email: 'ibrahimdanladi@hotmail.com',
    phone: '08051234567',
    nin: '11122233355', // Conflicting NIN! (last digits 55 vs 44 on PayKaduna)
    lastActivity: 'Renewed vehicle license for Peugeot 504',
    lastActivityDate: '2024-04-15',
    accountCreated: '2022-09-17'
  },
  {
    id: 'kadv-rec-203',
    tspId: 'kadvreg',
    name: 'Musa Ibrahim',
    email: 'musa.i@gmail.com',
    phone: '09031234567',
    // No NIN on file
    lastActivity: 'Registered Honda CR-V (Plate: KD-456-DEF)',
    lastActivityDate: '2024-05-20',
    accountCreated: '2023-12-01'
  }
]

// PIT Portal legacy records
export const PIT_LEGACY_RECORDS: LegacyTspRecord[] = [
  {
    id: 'pit-rec-301',
    tspId: 'pit',
    name: 'Fatima Abdullahi',
    email: 'fatima.abdullahi@yahoo.com',
    phone: '08031234567',
    nin: '12345678901',
    lastActivity: 'Annual personal income tax assessment 2023 filed',
    lastActivityDate: '2024-01-10',
    accountCreated: '2021-06-05'
  }
]
