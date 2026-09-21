export const UI_STORAGE_KEY = "rs_ui";

export type UiTheme = "light" | "dark";
export type UiRadius = "sharp" | "default" | "round";
export type UiDensity = "compact" | "comfortable" | "roomy";
export type UiSans = "figtree" | "system" | "arial" | "verdana" | "georgia" | "trebuchet" | "mono";
export type UiSerif = "fraunces" | "georgia" | "palatino" | "times" | "garamond" | "match";

export type UiSettings = {
  theme: UiTheme;
  fontSize: 90 | 100 | 110 | 125;
  fontSans: UiSans;
  fontSerif: UiSerif;
  weight: 400 | 500 | 600;
  letterSpacing: number;
  lineHeight: number;
  accent: string;
  action: string;
  ink: string;
  paper: string;
  card: string;
  radius: UiRadius;
  density: UiDensity;
};

export const UI_DEFAULTS: UiSettings = {
  theme: "light",
  fontSize: 100,
  fontSans: "figtree",
  fontSerif: "fraunces",
  weight: 400,
  letterSpacing: 0,
  lineHeight: 1.5,
  accent: "",
  action: "",
  ink: "",
  paper: "",
  card: "",
  radius: "default",
  density: "comfortable",
};

export const SANS_FONTS: Record<UiSans, { label: string; stack: string }> = {
  figtree: { label: "Figtree (default)", stack: 'var(--font-figtree), "Segoe UI", sans-serif' },
  system: { label: "System UI", stack: 'system-ui, "Segoe UI", sans-serif' },
  arial: { label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  verdana: { label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  georgia: { label: "Georgia", stack: 'Georgia, "Times New Roman", serif' },
  trebuchet: { label: "Trebuchet", stack: '"Trebuchet MS", sans-serif' },
  mono: { label: "Monospace", stack: 'ui-monospace, Consolas, "Courier New", monospace' },
};

export const SERIF_FONTS: Record<UiSerif, { label: string; stack: string }> = {
  fraunces: { label: "Fraunces (default)", stack: "var(--font-fraunces), Georgia, serif" },
  georgia: { label: "Georgia", stack: "Georgia, serif" },
  palatino: { label: "Palatino", stack: 'Palatino, "Palatino Linotype", serif' },
  times: { label: "Times New Roman", stack: '"Times New Roman", Times, serif' },
  garamond: { label: "Garamond", stack: 'Garamond, "Times New Roman", serif' },
  match: { label: "Same as body", stack: "var(--ui-font-sans)" },
};

const COLOR_KEYS = ["accent", "action", "ink", "paper", "card"] as const;
const TOKEN: Record<(typeof COLOR_KEYS)[number], string> = {
  accent: "--brass",
  action: "--seal",
  ink: "--ink",
  paper: "--paper",
  card: "--card",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

export function readUiSettings(): UiSettings {
  if (typeof window === "undefined") return { ...UI_DEFAULTS };
  try {
    const stored = window.localStorage.getItem(UI_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : {};
    const next = { ...UI_DEFAULTS };
    if (!isObject(parsed)) return next;
    if (parsed.theme === "light" || parsed.theme === "dark") next.theme = parsed.theme;
    else {
      const legacy = window.localStorage.getItem("rs_theme");
      if (legacy === "light" || legacy === "dark") next.theme = legacy;
    }
    if (parsed.fontSize === 90 || parsed.fontSize === 100 || parsed.fontSize === 110 || parsed.fontSize === 125) {
      next.fontSize = parsed.fontSize;
    }
    if (typeof parsed.fontSans === "string" && parsed.fontSans in SANS_FONTS) {
      next.fontSans = parsed.fontSans as UiSans;
    }
    if (typeof parsed.fontSerif === "string" && parsed.fontSerif in SERIF_FONTS) {
      next.fontSerif = parsed.fontSerif as UiSerif;
    }
    if (parsed.weight === 400 || parsed.weight === 500 || parsed.weight === 600) next.weight = parsed.weight;
    if (typeof parsed.letterSpacing === "number") next.letterSpacing = Math.min(0.12, Math.max(-0.04, parsed.letterSpacing));
    if (typeof parsed.lineHeight === "number") next.lineHeight = Math.min(1.9, Math.max(1.2, parsed.lineHeight));
    for (const key of COLOR_KEYS) {
      const value = parsed[key];
      if (typeof value === "string") next[key] = value;
    }
    if (parsed.radius === "sharp" || parsed.radius === "default" || parsed.radius === "round") next.radius = parsed.radius;
    if (parsed.density === "compact" || parsed.density === "comfortable" || parsed.density === "roomy") {
      next.density = parsed.density;
    }
    return next;
  } catch {
    return { ...UI_DEFAULTS };
  }
}

export function applyUiSettings(settings: UiSettings) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.setAttribute("data-theme", settings.theme);
  el.setAttribute("data-radius", settings.radius);
  el.setAttribute("data-density", settings.density);
  el.style.setProperty("--ui-text-scale", String(settings.fontSize / 100));
  el.style.setProperty("--ui-font-sans", SANS_FONTS[settings.fontSans].stack);
  el.style.setProperty("--ui-font-serif", SERIF_FONTS[settings.fontSerif].stack);
  el.style.setProperty("--ui-letter-spacing", `${settings.letterSpacing}em`);
  el.style.setProperty("--ui-line-height", String(settings.lineHeight));
  el.style.setProperty("--ui-weight", String(settings.weight));
  for (const key of COLOR_KEYS) {
    const token = TOKEN[key];
    const value = settings[key];
    if (value) el.style.setProperty(token, value);
    else el.style.removeProperty(token);
  }
  if (settings.paper) {
    el.style.setProperty("--app", settings.paper);
    el.style.setProperty("--paper-deep", `color-mix(in srgb, ${settings.paper} 88%, ${settings.ink || "#000"})`);
  } else {
    el.style.removeProperty("--app");
    el.style.removeProperty("--paper-deep");
  }
  if (settings.card) {
    el.style.setProperty("--header", settings.card);
    el.style.setProperty("--sidebar", settings.card);
    el.style.setProperty("--input", settings.card);
  } else {
    el.style.removeProperty("--header");
    el.style.removeProperty("--sidebar");
    el.style.removeProperty("--input");
  }
  if (settings.ink) {
    el.style.setProperty("--sidebar-text", settings.ink);
    el.style.setProperty("--ink-soft", `color-mix(in srgb, ${settings.ink} 62%, ${settings.paper || "#888"})`);
  } else {
    el.style.removeProperty("--sidebar-text");
    el.style.removeProperty("--ink-soft");
  }
  window.localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(settings));
  window.localStorage.setItem("rs_theme", settings.theme);
}

export function saveAndApplyUi(settings: UiSettings) {
  applyUiSettings(settings);
  return settings;
}
