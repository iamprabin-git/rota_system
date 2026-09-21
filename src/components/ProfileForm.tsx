"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { UserPhoto } from "@/components/UserPhoto";
import { panelLabel } from "@/lib/panel-nav";
import type { PublicProfile } from "@/lib/profile";

export function ProfileForm({ profile, jobHint }: { profile: PublicProfile; jobHint?: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || jobHint || "");
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [avatar, setAvatar] = useState(profile.avatar);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  function note(ok: string) {
    setError("");
    setMessage(ok);
    router.refresh();
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, jobTitle, notifyEmail }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not save your profile.");
      return;
    }
    note("Profile saved.");
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      setMessage("");
      return;
    }
    setPasswordSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current, next }),
    });
    const data = await response.json();
    setPasswordSaving(false);
    if (!response.ok) {
      setError(data.error || "Could not change password.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    note("Password updated.");
  }

  async function uploadPhoto(file: File) {
    setPhotoBusy(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("photo", file);
    const response = await fetch("/api/profile/photo", { method: "POST", body: form });
    const data = await response.json();
    setPhotoBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not update photo.");
      return;
    }
    setAvatar(`${data.avatar}?t=${Date.now()}`);
    note("Photo updated.");
  }

  async function removePhoto() {
    setPhotoBusy(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/profile/photo", { method: "DELETE" });
    const data = await response.json();
    setPhotoBusy(false);
    if (!response.ok) {
      setError(data.error || "Could not remove photo.");
      return;
    }
    setAvatar("");
    note("Photo removed.");
  }

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-[#f8ead2] px-4 py-3 text-sm text-warn">{error}</p> : null}
      {message ? <p className="rounded-xl bg-[color-mix(in_srgb,var(--ledger)_18%,var(--card))] px-4 py-3 text-sm text-ledger">{message}</p> : null}

      <section id="photo" className="card p-6 sm:p-8">
        <h2 className="serif text-2xl">Photo</h2>
        <p className="mt-1 text-sm text-ink-soft">Shown on your account button in every panel.</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <UserPhoto name={name} avatar={avatar} size="lg" />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="button" disabled={photoBusy} onClick={() => fileInput.current?.click()}>
              <Icon name="camera" size={16} />
              {photoBusy ? "Updating…" : avatar ? "Replace photo" : "Upload photo"}
            </button>
            {avatar ? (
              <button className="btn btn-ghost" type="button" disabled={photoBusy} onClick={removePhoto}>
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void uploadPhoto(file);
            }}
          />
        </div>
        <p className="mt-3 text-xs text-ink-soft">JPG, PNG or WebP · 2MB or smaller.</p>
      </section>

      <form id="contact" className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8" onSubmit={saveProfile}>
        <h2 className="serif text-2xl sm:col-span-2">Account details</h2>
        <p className="sm:col-span-2 -mt-2 text-sm text-ink-soft">
          {panelLabel(profile.role)} · {profile.email}
        </p>
        <label className="field">
          Display name
          <input required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          Job title
          <input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder={jobHint || "Optional"} />
        </label>
        <label className="field">
          Email
          <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="field">
          Phone
          <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="sm:col-span-2 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} />
          <span>
            Email me about payslips and account notices.
            <span className="mt-1 block text-ink-soft">Uses the address on this profile. You can turn this off at any time.</span>
          </span>
        </label>
        <div className="sm:col-span-2">
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? "Saving…" : "Save details"}
          </button>
        </div>
      </form>

      <form id="password" className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8" onSubmit={savePassword}>
        <h2 className="serif text-2xl sm:col-span-2">Change password</h2>
        <p className="sm:col-span-2 -mt-2 text-sm text-ink-soft">Use at least 8 characters. You will stay signed in on this device.</p>
        <label className="field sm:col-span-2">
          Current password
          <input required type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
        </label>
        <label className="field">
          New password
          <input required type="password" autoComplete="new-password" minLength={8} value={next} onChange={(event) => setNext(event.target.value)} />
        </label>
        <label className="field">
          Confirm new password
          <input required type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </label>
        <div className="sm:col-span-2">
          <button className="btn btn-accent" disabled={passwordSaving} type="submit">
            <Icon name="lock" size={16} />
            {passwordSaving ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
