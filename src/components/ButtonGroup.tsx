import type { ReactNode } from "react";

export function ActionBar({ children }: { children: ReactNode }) {
  return <div className="action-bar">{children}</div>;
}

export function ButtonGroup({
  label,
  joined,
  children,
}: {
  label?: string;
  joined?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="btn-group">
      {label ? <p className="btn-group-label">{label}</p> : null}
      <div className={`btn-group-row${joined ? " joined" : ""}`}>{children}</div>
    </div>
  );
}
