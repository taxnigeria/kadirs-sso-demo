import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VehicleRecord {
  id: string
  ownerCitizenId: string
  ownerName: string
  plateNumber: string
  vin: string
  engineNumber: string
  make: string
  model: string
  year: number
  color: string
  category: 'private' | 'commercial' | 'government'
  roadWorthinessExpiry: string
  insuranceExpiry: string
  hackneyPermit?: string
  registrationDate: string
  status: 'active' | 'expiring_soon' | 'expired'
  lgaAssigned: string
}

const INITIAL_VEHICLES: VehicleRecord[] = [
  {
    id: 'VEH-KD-2022-004491',
    ownerCitizenId: 'CIT-KAD-2024-00847', // Fatima Abdullahi
    ownerName: 'Fatima Aminu Abdullahi',
    plateNumber: 'KD-482-ZAR',
    vin: 'JT2BF28K5X019284',
    engineNumber: '2ZR-FE-98124',
    make: 'Toyota',
    model: 'Corolla 1.8 XLi',
    year: 2018,
    color: 'Metallic Silver',
    category: 'private',
    roadWorthinessExpiry: '2025-11-30',
    insuranceExpiry: '2025-12-15',
    hackneyPermit: undefined,
    registrationDate: '2022-03-14',
    status: 'active',
    lgaAssigned: 'Kaduna North'
  }
]

interface VehicleState {
  vehicles: VehicleRecord[]
  getVehiclesByOwner: (citizenId: string) => VehicleRecord[]
  registerVehicle: (vehicle: Omit<VehicleRecord, 'id' | 'registrationDate' | 'status'>) => VehicleRecord
  renewLicense: (vehicleId: string) => void
  resetToInitial: () => void
}

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      vehicles: INITIAL_VEHICLES,

      getVehiclesByOwner: (citizenId: string) => {
        return get().vehicles.filter((v) => v.ownerCitizenId === citizenId)
      },

      registerVehicle: (data) => {
        const id = `VEH-KD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
        const newVehicle: VehicleRecord = {
          ...data,
          id,
          registrationDate: new Date().toISOString().split('T')[0],
          status: 'active'
        }
        set((state) => ({
          vehicles: [newVehicle, ...state.vehicles]
        }))
        return newVehicle
      },

      renewLicense: (vehicleId: string) => {
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        const newExpiry = nextYear.toISOString().split('T')[0]

        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === vehicleId
              ? { ...v, roadWorthinessExpiry: newExpiry, insuranceExpiry: newExpiry, status: 'active' }
              : v
          )
        }))
      },

      resetToInitial: () => {
        set({ vehicles: INITIAL_VEHICLES })
      }
    }),
    {
      name: 'kadirs_vehicle_records_v1'
    }
  )
)
