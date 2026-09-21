"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";

type LoginReason =
  | "missing_email"
  | "missing_password"
  | "unknown_email"
  | "wrong_password"
  | "pending"
  | "disabled"
  | "company_disallowed"
  | "company_deactive"
  | "invalid"
  | "server"
  | "";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const redirected = (search.get("reason") || "") as LoginReason;
  const [error, setError] = useState(
    redirected === "company_deactive"
      ? "This company is deactive because payment is outstanding."
      : redirected === "company_disallowed"
        ? "This company is not allowed to use the system."
        : "",
  );
  const [reason, setReason] = useState<LoginReason>(redirected === "company_deactive" || redirected === "company_disallowed" ? redirected : "");
  const [saving, setSaving] = useState(false);

  const emailInvalid = reason === "missing_email" || reason === "unknown_email";
  const passwordInvalid = reason === "missing_password" || reason === "wrong_password";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setReason("missing_email");
      setError("Enter your email or login ID.");
      return;
    }
    if (!password) {
      setReason("missing_password");
      setError("Enter your password.");
      return;
    }
    setSaving(true);
    setError("");
    setReason("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const text = await response.text();
      let data: { error?: string; reason?: LoginReason; redirect?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text) as { error?: string; reason?: LoginReason; redirect?: string };
        } catch {
          throw new Error("Could not sign in. Please try again.");
        }
      }
      if (!response.ok) {
        setReason(data.reason || "invalid");
        setError(data.error || "Could not sign in.");
        return;
      }
      const next = search.get("next");
      const dest =
        next && next.startsWith("/") && !next.startsWith("//") && next !== "/" && !next.startsWith("/login")
          ? next
          : data.redirect || "/admin";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setReason("server");
      setError(err instanceof Error ? err.message : "Could not sign in. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="login-form" noValidate>
      <div className="login-form-head">
        <p className="login-kicker">Welcome back</p>
        <h2 className="serif login-form-title">Sign in</h2>
        <p className="login-form-copy">Use the email or login ID and password for your admin, agent or user account.</p>
      </div>

      {error ? (
        <p className="login-error" role="alert">
          <Icon name="lock" size={16} />
          <span>{error}</span>
        </p>
      ) : null}

      <label className={`field ${emailInvalid ? "field-invalid" : ""}`}>
        Email or login ID
        <input
          autoComplete="username"
          type="text"
          required
          value={email}
          aria-invalid={emailInvalid}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailInvalid) {
              setError("");
              setReason("");
            }
          }}
        />
        {reason === "unknown_email" ? <span className="field-hint">Check the spelling, or ask admin for the login ID.</span> : null}
      </label>

      <label className={`field ${passwordInvalid ? "field-invalid" : ""}`}>
        Password
        <span className="login-password">
          <input
            autoComplete="current-password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            aria-invalid={passwordInvalid}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordInvalid) {
                setError("");
                setReason("");
              }
            }}
          />
          <button
            className="login-password-toggle"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </span>
        {reason === "wrong_password" ? <span className="field-hint">The email is recognised, but this password is wrong.</span> : null}
      </label>

      <button className="btn btn-primary login-submit" disabled={saving} type="submit">
        {saving ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
