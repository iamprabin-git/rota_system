import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="login-theme">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-brass">Admin · Agent · User</p>
        <h1 className="serif mt-2 text-4xl">Sign in to RotaSystem</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Three panels: platform admin for companies, company agents for payroll, and users for personal hours and pay.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {[
            ["shield", "Admin"],
            ["briefcase", "Agent"],
            ["user", "User"],
          ].map(([icon, label]) => (
            <span key={label} className="nav-icon-link rounded-full border border-rule bg-card px-3 py-1.5 text-sm text-ink-soft">
              <Icon name={icon as "shield" | "briefcase" | "user"} size={14} />
              {label}
            </span>
          ))}
        </div>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
      <div className="mt-8 max-w-lg space-y-1 text-center text-sm text-ink-soft">
        <p className="font-semibold text-ink">Demo logins</p>
        <p>Admin: admin@rotasystem.local · RotaAdmin26</p>
        <p>Agent (RotaSystem Care): agent@rotasystem.local · Agent2026</p>
        <p>User (RotaSystem Care): amira@rotasystem.local · Hours2026</p>
        <p>Agent (Harbourview): priya@harbourview.local · Agent2026</p>
        <p>User (Harbourview): niamh@harbourview.local · Hours2026</p>
      </div>
    </div>
  );
}
