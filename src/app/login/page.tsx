import { Suspense } from "react";
import { Icon } from "@/components/Icon";
import { LoginForm } from "@/components/LoginForm";
import { UiSettings } from "@/components/UiSettings";

const ROLES = [
  ["shield", "Admin", "Companies, agents and platform access"],
  ["briefcase", "Agent", "Rota, hours, payslips and staff logins"],
  ["user", "User", "Your hours, statements, rota and pay"],
] as const;

const DEMOS = [
  ["Admin", "admin@rotasystem.local", "RotaAdmin26"],
  ["Agent", "agent@rotasystem.local", "Agent2026"],
  ["User", "amira@rotasystem.local", "Hours2026"],
] as const;

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-theme">
        <UiSettings />
      </div>

      <aside className="login-brand">
        <div className="login-brand-mark">
          <span className="login-brand-icon">
            <Icon name="briefcase" size={18} />
          </span>
          <div>
            <p className="login-kicker light">UK payroll workspace</p>
            <p className="serif login-brand-name">RotaSystem</p>
          </div>
        </div>
        <h1 className="serif login-brand-title">Hours, rota and payslips in one place.</h1>
        <p className="login-brand-copy">
          Sign in to the panel that matches your role. Company name and logo follow the employer you belong to.
        </p>
        <ul className="login-roles">
          {ROLES.map(([icon, label, hint]) => (
            <li key={label}>
              <span className="login-role-icon">
                <Icon name={icon} size={16} />
              </span>
              <span>
                <strong>{label}</strong>
                <span>{hint}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="login-demos">
          <p className="login-kicker light">Demo access</p>
          {DEMOS.map(([role, email, password]) => (
            <p key={email}>
              <strong>{role}</strong> {email}
              <span> · {password}</span>
            </p>
          ))}
        </div>
      </aside>

      <main className="login-panel">
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
