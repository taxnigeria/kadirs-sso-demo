export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-md">
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight">KADIRS Auth System 2.0</h3>
            <p className="text-sm font-medium text-muted-foreground">Centralised Identity & Access Management Platform</p>
            <p className="text-sm text-muted-foreground">Coming in Phase 12</p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <a
              href="/auth/register"
              className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Start as Citizen
            </a>
            <a
              href="/admin"
              className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              Start as Admin
            </a>
            <a
              href="#ecosystem"
              className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              View Ecosystem
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
