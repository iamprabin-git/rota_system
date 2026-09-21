import type { IconName } from "@/components/Icon";

export type NoticeKind = "pay" | "hours" | "statement" | "file" | "user" | "company" | "agent" | "rota";

export type StaffNotice = {
  id: string;
  title: string;
  body: string;
  href: string;
  kind: NoticeKind;
  createdAt: string;
};

export function noticeIcon(kind: NoticeKind): IconName {
  if (kind === "pay") return "wallet";
  if (kind === "hours") return "clock";
  if (kind === "rota") return "calendar";
  if (kind === "file") return "folder";
  if (kind === "user") return "user";
  if (kind === "company") return "building";
  if (kind === "agent") return "users";
  return "fileText";
}
