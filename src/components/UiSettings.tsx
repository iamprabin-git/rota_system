"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/Icon";
import {
  applyUiSettings,
  readUiSettings,
  SANS_FONTS,
  SERIF_FONTS,
  UI_DEFAULTS,
  type UiDensity,
  type UiRadius,
  type UiSans,
  type UiSerif,
  type UiSettings,
  type UiTheme,
} from "@/lib/ui-settings";

const ACCENT_PRESETS = ["#8d6b3e", "#24364d", "#8c2f24", "#1f5c48", "#2b5f8a", "#6b3f8a"];
const ACTION_PRESETS = ["#8c2f24", "#1f5c48", "#24364d", "#9a5b12", "#2b5f8a", "#8d6b3e"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="ui-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Swatches({
  value,
  presets,
  onChange,
}: {
  value: string;
  presets: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="ui-swatches">
      <button type="button" className={`ui-swatch theme ${value ? "" : "on"}`} onClick={() => onChange("")}>
        Theme
      </button>
      {presets.map((color) => (
        <button
          key={color}
          type="button"
          className={`ui-swatch ${value === color ? "on" : ""}`}
          style={{ background: color }}
          aria-label={color}
          onClick={() => onChange(color)}
        />
      ))}
      <input type="color" value={value || "#8d6b3e"} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function UiSettings({
  variant = "icon",
  onOpen,
}: {
  variant?: "icon" | "nav";
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UiSettings>(UI_DEFAULTS);

  useEffect(() => {
    setMounted(true);
    const current = readUiSettings();
    setSettings(current);
    applyUiSettings(current);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function update<K extends keyof UiSettings>(key: K, value: UiSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    applyUiSettings(next);
  }

  function reset() {
    const next = { ...UI_DEFAULTS, theme: settings.theme };
    setSettings(next);
    applyUiSettings(next);
  }

  const panel =
    mounted ? (
      createPortal(
        <>
          <div className={`ui-scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
          <aside
            className={`ui-drawer ${open ? "open" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Display settings"
            aria-hidden={!open}
            inert={!open}
          >
        <div className="ui-drawer-head">
          <div>
            <p className="staff-kicker">Display</p>
            <h2 className="serif text-2xl">Settings</h2>
          </div>
          <button className="staff-icon-btn" type="button" aria-label="Close settings" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className="ui-drawer-body">
          <section>
            <h3 className="ui-section">Theme</h3>
            <div className="theme-switch">
              {(["light", "dark"] as UiTheme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={settings.theme === theme ? "on" : ""}
                  onClick={() => update("theme", theme)}
                >
                  {theme === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="ui-section">Type</h3>
            <Field label="Font size">
              <select
                value={settings.fontSize}
                onChange={(event) => update("fontSize", Number(event.target.value) as UiSettings["fontSize"])}
              >
                <option value={90}>Small</option>
                <option value={100}>Default</option>
                <option value={110}>Large</option>
                <option value={125}>Extra large</option>
              </select>
            </Field>
            <Field label="Body font">
              <select value={settings.fontSans} onChange={(event) => update("fontSans", event.target.value as UiSans)}>
                {Object.entries(SANS_FONTS).map(([key, font]) => (
                  <option key={key} value={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Heading font">
              <select value={settings.fontSerif} onChange={(event) => update("fontSerif", event.target.value as UiSerif)}>
                {Object.entries(SERIF_FONTS).map(([key, font]) => (
                  <option key={key} value={key}>
                    {font.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Font weight">
              <select value={settings.weight} onChange={(event) => update("weight", Number(event.target.value) as UiSettings["weight"])}>
                <option value={400}>Regular</option>
                <option value={500}>Medium</option>
                <option value={600}>Semibold</option>
              </select>
            </Field>
            <Field label={`Letter spacing (${settings.letterSpacing.toFixed(2)}em)`}>
              <input
                type="range"
                min={-0.04}
                max={0.12}
                step={0.01}
                value={settings.letterSpacing}
                onChange={(event) => update("letterSpacing", Number(event.target.value))}
              />
            </Field>
            <Field label={`Line height (${settings.lineHeight.toFixed(2)})`}>
              <input
                type="range"
                min={1.2}
                max={1.9}
                step={0.05}
                value={settings.lineHeight}
                onChange={(event) => update("lineHeight", Number(event.target.value))}
              />
            </Field>
          </section>

          <section>
            <h3 className="ui-section">Colour</h3>
            <Field label="Accent">
              <Swatches value={settings.accent} presets={ACCENT_PRESETS} onChange={(value) => update("accent", value)} />
            </Field>
            <Field label="Buttons & alerts">
              <Swatches value={settings.action} presets={ACTION_PRESETS} onChange={(value) => update("action", value)} />
            </Field>
            <Field label="Text">
              <Swatches value={settings.ink} presets={["#1b2433", "#111827", "#e8eef5", "#5b6573"]} onChange={(value) => update("ink", value)} />
            </Field>
            <Field label="Background">
              <Swatches value={settings.paper} presets={["#f4efe6", "#eef1f4", "#ffffff", "#101722"]} onChange={(value) => update("paper", value)} />
            </Field>
            <Field label="Cards">
              <Swatches value={settings.card} presets={["#fffcf7", "#ffffff", "#1a2330", "#141c28"]} onChange={(value) => update("card", value)} />
            </Field>
          </section>

          <section>
            <h3 className="ui-section">Layout</h3>
            <Field label="Corners">
              <select value={settings.radius} onChange={(event) => update("radius", event.target.value as UiRadius)}>
                <option value="sharp">Sharp</option>
                <option value="default">Default</option>
                <option value="round">Round</option>
              </select>
            </Field>
            <Field label="Density">
              <select value={settings.density} onChange={(event) => update("density", event.target.value as UiDensity)}>
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
                <option value="roomy">Roomy</option>
              </select>
            </Field>
          </section>
        </div>
        <div className="ui-drawer-foot">
          <button className="btn btn-ghost" type="button" onClick={reset}>
            Reset appearance
          </button>
        </div>
          </aside>
        </>,
        document.body,
      )
    ) : null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  }

  const trigger =
    variant === "nav" ? (
      <button className={`staff-link ${open ? "active" : ""}`} type="button" aria-expanded={open} onClick={toggle}>
        <span className="staff-link-icon">
          <Icon name="settings" size={16} />
        </span>
        <span className="staff-link-copy">
          <span className="block font-semibold">Settings</span>
          <span className="staff-link-hint">Appearance and display</span>
        </span>
      </button>
    ) : (
      <button
        className="staff-icon-btn"
        type="button"
        title="Display settings"
        aria-label="Display settings"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="settings" size={18} />
      </button>
    );

  return (
    <div className={`ui-settings ${variant}`}>
      {trigger}
      {panel}
    </div>
  );
}
