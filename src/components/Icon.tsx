import type { ReactNode } from "react";

export type IconName =
  | "building"
  | "buildingPlus"
  | "layout"
  | "calendar"
  | "users"
  | "user"
  | "userPlus"
  | "fileText"
  | "filePlus"
  | "briefcase"
  | "clock"
  | "wallet"
  | "folder"
  | "home"
  | "shield"
  | "plus"
  | "logout"
  | "bell"
  | "banknote"
  | "receipt"
  | "settings"
  | "lock"
  | "camera"
  | "mail"
  | "phone"
  | "chevron"
  | "check"
  | "x"
  | "printer"
  | "calculator";

const PATHS: Record<IconName, ReactNode> = {
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 21v-7h6v7" />
      <path d="M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01" />
    </>
  ),
  buildingPlus: (
    <>
      <rect x="3" y="3" width="13" height="18" rx="2" />
      <path d="M8 21v-6h3v6" />
      <path d="M7 8h.01M10.5 8h.01M7 12h.01M10.5 12h.01" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  userPlus: (
    <>
      <path d="M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h4" />
    </>
  ),
  filePlus: (
    <>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M12 12v6M9 15h6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  wallet: (
    <>
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h16" />
      <circle cx="17" cy="14" r="1.2" />
    </>
  ),
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20z" />
      <path d="M9.5 21.5v-7h5v7" />
    </>
  ),
  shield: (
    <path d="M12 3 5 6v6c0 4.5 3.1 7.7 7 9 3.9-1.3 7-4.5 7-9V6z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>
  ),
  bell: (
    <>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </>
  ),
  banknote: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M6 12h.01M18 12h.01" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3v18l3-1.5L12 21l3-1.5L18 21V3l-3 1.5L12 3 9 4.5z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 8l9 6 9-6" />
    </>
  ),
  phone: (
    <>
      <path d="M7 3h4l1.5 4-2 1.5a12 12 0 0 0 5 5L17 12l4 1.5V17.5A2.5 2.5 0 0 1 18.5 20 15 15 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3H7z" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5 9.5 17 19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  printer: (
    <>
      <path d="M6 9V4h12v5" />
      <rect x="6" y="13" width="12" height="7" rx="1" />
      <path d="M6 14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
      <path d="M8 17h8" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
