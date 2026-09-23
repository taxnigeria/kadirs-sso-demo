import {
  Shield,
  Wallet,
  Car,
  FileText,
  Lock,
  Home,
  UserPlus,
  LogIn,
  User,
  Users,
  Building2,
  Layers,
  LayoutDashboard,
  ClipboardList,
  CarFront,
  FileSpreadsheet,
  CheckSquare,
  AlertTriangle,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

export interface PortalConfig {
  id: string
  name: string
  shortName: string
  description: string
  icon: LucideIcon
  color: string       // Tailwind bg class
  textColor: string   // Tailwind text class
  navItems: NavItem[]
}

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const PORTALS: Record<string, PortalConfig> = {
  auth: {
    id: "auth",
    name: "KADIRS Auth Portal",
    shortName: "Auth Portal",
    description: "Centralised Identity & Access Management",
    icon: Shield,
    color: "bg-kadirs-navy",
    textColor: "text-kadirs-navy",
    navItems: [
      { label: "Register", path: "/auth/register", icon: UserPlus },
      { label: "Sign In", path: "/auth/login", icon: LogIn },
      { label: "My Profile", path: "/auth/profile", icon: User },
    ],
  },
  paykaduna: {
    id: "paykaduna",
    name: "PayKaduna",
    shortName: "PayKaduna",
    description: "Customer dashboard & revenue payments",
    icon: Wallet,
    color: "bg-emerald-600",
    textColor: "text-emerald-600",
    navItems: [
      { label: "Dashboard", path: "/paykaduna", icon: LayoutDashboard },
      { label: "Services", path: "/paykaduna/services", icon: ClipboardList },
      { label: "Citizen Profile", path: "/auth/profile", icon: User },
    ],
  },
  kadvreg: {
    id: "kadvreg",
    name: "KADVREG — Vehicle Licensing",
    shortName: "KADVREG",
    description: "Kaduna State Motor Vehicle Administration",
    icon: Car,
    color: "bg-blue-600",
    textColor: "text-blue-600",
    navItems: [
      { label: "Dashboard", path: "/kadvreg", icon: LayoutDashboard },
      { label: "Vehicle Fleet", path: "/kadvreg", icon: CarFront },
    ],
  },
  pit: {
    id: "pit",
    name: "PIT Portal",
    shortName: "PIT Portal",
    description: "Personal income tax filing",
    icon: FileText,
    color: "bg-amber-600",
    textColor: "text-amber-600",
    navItems: [
      { label: "Dashboard", path: "/pit", icon: LayoutDashboard },
      { label: "Tax Filing", path: "/pit/filing", icon: FileSpreadsheet },
    ],
  },
  admin: {
    id: "admin",
    name: "KADIRS Admin",
    shortName: "Admin",
    description: "Internal administration & governance",
    icon: Lock,
    color: "bg-[#152A2E] dark:bg-emerald-800",
    textColor: "text-[#152A2E] dark:text-emerald-400",
    navItems: [
      { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Approval Queue", path: "/admin/approvals", icon: CheckSquare },
      { label: "Citizens", path: "/admin/citizens", icon: Users },
      { label: "Entities", path: "/admin/entities", icon: Building2 },
      { label: "TSP Registry", path: "/admin/tsps", icon: Layers },
      { label: "Audit & Reports", path: "/admin/reports", icon: ScrollText },
    ],
  },
  home: {
    id: "home",
    name: "KADIRS Auth System 2.0",
    shortName: "Home",
    description: "Centralised Identity & Access Management Platform",
    icon: Home,
    color: "bg-kadirs-navy",
    textColor: "text-kadirs-navy",
    navItems: [],
  },
}

/** TSP configurations for the service directory */
export const TSP_REGISTRY = [
  { id: "paykaduna", name: "PayKaduna", description: "Customer dashboard, revenue payments", personas: "All personas", icon: Wallet },
  { id: "kadvreg", name: "KADVREG", description: "Vehicle registration & licence renewal", personas: "Individual / Corporate", icon: Car },
  { id: "pit", name: "PIT Portal", description: "Personal income tax filing", personas: "Individual only", icon: FileText },
  { id: "biz-reg", name: "Business Registration", description: "New business registration", personas: "Corporate", icon: ClipboardList },
  { id: "land-reg", name: "Land Registry", description: "Land title & property registration", personas: "All personas", icon: Home },
  { id: "subeb", name: "SUBEB", description: "Education board services", personas: "Government", icon: ScrollText },
  { id: "zakat", name: "Zakat Board", description: "Zakat collection & distribution", personas: "Individual", icon: Shield },
  { id: "water", name: "Water Board", description: "Water utility billing", personas: "All personas", icon: Home },
  { id: "kasepa", name: "KASEPA", description: "Environmental protection", personas: "Corporate", icon: AlertTriangle },
  { id: "kirmas", name: "KIRMAS", description: "Road maintenance agency", personas: "All personas", icon: Car },
  { id: "tsp-11", name: "Health Services", description: "Healthcare registration", personas: "Individual", icon: User },
  { id: "tsp-12", name: "Agriculture", description: "Agricultural services", personas: "All personas", icon: Home },
  { id: "tsp-13", name: "Transport", description: "Transport licensing", personas: "Individual / Corporate", icon: CarFront },
  { id: "tsp-14", name: "Social Services", description: "Welfare & social programs", personas: "Individual", icon: User },
] as const
