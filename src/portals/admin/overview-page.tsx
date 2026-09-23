import { Link } from 'react-router'
import {
  CheckSquare,
  Users,
  Download,
  Layers
} from 'lucide-react'
import { useAdminEngine } from '@/engine/admin-engine'
import { AdminConsoleLayout } from './admin-console-layout'

export default function AdminOverviewPage() {
  const makerCheckerItems = useAdminEngine((s) => s.makerCheckerItems)
  const getTelemetryMetrics = useAdminEngine((s) => s.getTelemetryMetrics)

  const telemetry = getTelemetryMetrics()
  const pendingCount = makerCheckerItems.filter((i) => i.status === 'pending').length
  const disputeCount = makerCheckerItems.filter((i) => i.category === 'disputed_account').length

  return (
    <AdminConsoleLayout>
      <div className="space-y-6">
        {/* 6 Real-time KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Registered Citizens</span>
            <div className="font-sans font-bold text-xl text-[var(--ink)]">524,200</div>
            <span className="text-[10px] text-[var(--green)] font-medium">100% NIMC Verified</span>
          </div>

          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Connected MDAs</span>
            <div className="font-sans font-bold text-xl text-[var(--green)]">14 Active TSPs</div>
            <span className="text-[10px] text-[var(--ink-soft)]">RS256 Scoped</span>
          </div>

          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Pending Approvals</span>
            <div className="font-sans font-bold text-xl text-amber-600">
              {pendingCount}
            </div>
            <span className="text-[10px] text-amber-700 font-medium">Action Required</span>
          </div>

          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">Dispute Cases</span>
            <div className="font-sans font-bold text-xl text-blue-600">
              {disputeCount}
            </div>
            <span className="text-[10px] text-blue-700 font-medium">Adjudication Desk</span>
          </div>

          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">24h Event Velocity</span>
            <div className="font-sans font-bold text-xl text-[var(--ink)]">
              {telemetry.totalEventsLogged24h}
            </div>
            <span className="text-[10px] text-[var(--green)] font-medium">Append-Only Feed</span>
          </div>

          <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-4 rounded-[var(--radius)] space-y-1">
            <span className="text-[10.5px] uppercase font-bold text-[var(--ink-soft)]">30-Day SLA Uptime</span>
            <div className="font-sans font-bold text-xl text-[var(--green)]">
              {telemetry.thirtyDayUptimePercentage}%
            </div>
            <span className="text-[10px] text-[var(--green)] font-medium">Target: &ge;99.9%</span>
          </div>
        </div>

        {/* Telemetry Gauge Cards */}
        <div className="bg-[var(--paper-raised)] border border-[var(--line)] p-5 rounded-[var(--radius)] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="font-sans font-semibold text-base text-[var(--ink)]">
              Live Gateway &amp; Telemetry Health
            </h2>
            <span className="text-xs font-mono text-[var(--green)] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-ping" />
              Live Mesh Telemetry Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1.5">
              <span className="text-[11px] text-[var(--ink-soft)] font-medium">Auth Success Rate</span>
              <div className="font-bold text-lg text-[var(--ink)]">{telemetry.authSuccessRate}%</div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--green)] h-full" style={{ width: `${telemetry.authSuccessRate}%` }} />
              </div>
              <span className="text-[10px] text-[var(--green)] block">99.4% threshold met</span>
            </div>

            <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1.5">
              <span className="text-[11px] text-[var(--ink-soft)] font-medium">OTP Carrier Delivery (Termii / Telco)</span>
              <div className="font-bold text-lg text-[var(--ink)]">{telemetry.otpDeliveryRate}%</div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--green)] h-full" style={{ width: `${telemetry.otpDeliveryRate}%` }} />
              </div>
              <span className="text-[10px] text-[var(--green)] block">Sub-10s delivery SLA</span>
            </div>

            <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1.5">
              <span className="text-[11px] text-[var(--ink-soft)] font-medium">NIMC Dojah Latency</span>
              <div className="font-bold text-lg text-[var(--ink)]">{telemetry.nimcDojahLatencyMs} ms</div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--green)] h-full" style={{ width: `70%` }} />
              </div>
              <span className="text-[10px] text-[var(--green)] block">Optimal NIMC Trip Time</span>
            </div>

            <div className="p-3.5 bg-[var(--paper)] border border-[var(--line)] rounded space-y-1.5">
              <span className="text-[11px] text-[var(--ink-soft)] font-medium">Kafka Consumer Lag</span>
              <div className="font-bold text-lg text-[var(--green)]">{telemetry.kafkaConsumerLagSeconds}s</div>
              <div className="w-full bg-[var(--line)] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[var(--green)] h-full" style={{ width: `10%` }} />
              </div>
              <span className="text-[10px] text-[var(--ink-soft)] font-mono">kadirs.identity.events</span>
            </div>
          </div>
        </div>

        {/* Quick Nav Spokes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <Link
            to="/admin/approvals"
            className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors shadow-2xs block"
          >
            <div className="flex items-center justify-between text-[var(--green)]">
              <CheckSquare className="w-5 h-5" />
              <span className="font-bold text-[11px]">Open Queue &rarr;</span>
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">Review Approval Queue</h3>
            <p className="text-[11.5px] text-[var(--ink-soft)]">
              Maker/Checker review for agency onboarding, officer grants, rep transfers, and fraud flags.
            </p>
          </Link>

          <Link
            to="/admin/citizens"
            className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors shadow-2xs block"
          >
            <div className="flex items-center justify-between text-blue-600">
              <Users className="w-5 h-5" />
              <span className="font-bold text-[11px]">Manage Accounts &rarr;</span>
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">Citizen Account Governance</h3>
            <p className="text-[11.5px] text-[var(--ink-soft)]">
              Enforce system-wide account suspensions (locking all 14 TSPs) or trigger forced credential resets.
            </p>
          </Link>

          <Link
            to="/admin/tsps"
            className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors shadow-2xs block"
          >
            <div className="flex items-center justify-between text-emerald-600">
              <Layers className="w-5 h-5" />
              <span className="font-bold text-[11px]">Manage TSPs &rarr;</span>
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">TSP OAuth Management</h3>
            <p className="text-[11.5px] text-[var(--ink-soft)]">
              Zero-downtime 24-hour dual-secret rotation, scope governance, and client registration.
            </p>
          </Link>

          <Link
            to="/admin/reports"
            className="p-4 bg-[var(--paper-raised)] hover:bg-[var(--line-soft)] border border-[var(--line)] rounded-[var(--radius)] text-left space-y-2 transition-colors shadow-2xs block"
          >
            <div className="flex items-center justify-between text-amber-600">
              <Download className="w-5 h-5" />
              <span className="font-bold text-[11px]">NDPC Export &rarr;</span>
            </div>
            <h3 className="font-bold text-sm text-[var(--ink)]">Export Annual NDPA CAR</h3>
            <p className="text-[11.5px] text-[var(--ink-soft)]">
              Structured statutory compliance report for NDPC annual filing due March 31.
            </p>
          </Link>
        </div>
      </div>
    </AdminConsoleLayout>
  )
}
